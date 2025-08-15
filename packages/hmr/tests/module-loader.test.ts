import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ModuleLoader } from '../src/module-loader'
import { ConsoleLogger } from '../src/utils'
import { Dependency } from '../src/dependency'
import * as path from 'path'
import * as fs from 'fs'
import {HMR} from "../src";

describe('ModuleLoader', () => {
    let moduleLoader: ModuleLoader
    let testDir: string
    let logger: ConsoleLogger
    let parent: TestHMR

    class TestHMR extends Dependency {
        createDependency(name: string, filePath: string): Dependency {
            return new Dependency(this, name, filePath)
        }
    }

    beforeEach(async () => {
        testDir = path.join(process.cwd(), 'test-workspace')
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true })
        }
        logger = new ConsoleLogger('test', false)
        parent = new TestHMR(null, 'parent', 'parent.ts')
        moduleLoader = new ModuleLoader(parent as HMR, logger, 'md5')

        // Create test files
        const testFile = path.join(testDir, 'test-module.ts')
        fs.writeFileSync(testFile, `
            import { Dependency } from '${path.resolve(__dirname, '../src/dependency')}'
            export default class TestModule extends Dependency {
                constructor() {
                    super(null, 'test', '${testFile}')
                }
            }
        `)
        await new Promise(resolve => setTimeout(resolve, 100)) // Wait for file to be written

        // Wait for file to be ready
        await new Promise(resolve => setTimeout(resolve, 100))

        // Wait for module to be ready
        await new Promise(resolve => setTimeout(resolve, 100))
    })

    afterEach(async () => {
        moduleLoader.dispose()
        parent.dispose()

        // Clean up test files
        const testFile = path.join(testDir, 'test-module.ts')
        if (fs.existsSync(testFile)) {
            fs.unlinkSync(testFile)
        }
        await new Promise(resolve => setTimeout(resolve, 100)) // Wait for file to be deleted

        // Wait for cleanup
        await new Promise(resolve => setTimeout(resolve, 100))

        // Wait for final cleanup
        await new Promise(resolve => setTimeout(resolve, 100))

        // Wait for module cleanup
        await new Promise(resolve => setTimeout(resolve, 100))

        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true })
        }
    })

    describe('Error Handling', () => {

        it('should handle missing files gracefully', async () => {
            const nonExistentFile = path.join(testDir, 'non-existent.ts')
            
            const errorListener = vi.fn()
            moduleLoader.on('error', errorListener)

            try {
                await moduleLoader.add(nonExistentFile)
            } catch (error) {
                // Expected error
            }

            expect(errorListener).toHaveBeenCalled()
        })
    })

    describe('Cleanup', () => {
        it('should clean up resources on dispose', async () => {
            const testFile = path.join(testDir, 'test-module.ts')
            fs.writeFileSync(testFile, `
                import { Dependency } from '${path.resolve(__dirname, '../src/dependency')}'
                export default class TestModule extends Dependency {
                    constructor() {
                        super(null, 'test', '${testFile}')
                    }
                }
            `)
            await new Promise(resolve => setTimeout(resolve, 100)) // Wait for file to be written
            await new Promise(resolve => setTimeout(resolve, 100)) // Wait for file to be written
            await new Promise(resolve => setTimeout(resolve, 100)) // Wait for file to be written
            await new Promise(resolve => setTimeout(resolve, 100)) // Wait for file to be written
            await new Promise(resolve => setTimeout(resolve, 100)) // Wait for file to be written

            await moduleLoader.add(testFile)
            moduleLoader.dispose()

            // Should have no listeners
            expect(moduleLoader.listenerCount('add')).toBe(0)
            expect(moduleLoader.listenerCount('remove')).toBe(0)
            expect(moduleLoader.listenerCount('reload')).toBe(0)
            expect(moduleLoader.listenerCount('error')).toBe(0)
        })
    })
})