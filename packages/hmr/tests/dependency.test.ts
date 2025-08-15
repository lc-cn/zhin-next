import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Dependency } from '../src/dependency'
import { Context } from '../src/types'

describe('Dependency', () => {
    let dependency: Dependency
    let childDependency: Dependency

    beforeEach(() => {
        dependency = new Dependency(null, 'test', 'test.ts')
        childDependency = new Dependency(dependency, 'child', 'child.ts')
        dependency.dependencies.set(childDependency.filename, childDependency)
    })

    afterEach(() => {
        dependency.dispose()
        childDependency.dispose()
    })

    describe('Lifecycle Management', () => {
        it('should initialize in waiting state', () => {
            expect(dependency.getLifecycleState()).toBe('waiting')
        })

        it('should transition to ready state after mounting', async () => {
            await dependency.mounted()
            expect(dependency.getLifecycleState()).toBe('ready')
        })

        it('should transition to disposed state after disposal', () => {
            dependency.dispose()
            expect(dependency.getLifecycleState()).toBe('disposed')
        })

        it('should emit lifecycle-changed event on state change', () => {
            const listener = vi.fn()
            dependency.on('lifecycle-changed', listener)
            dependency.setLifecycleState('ready')
            expect(listener).toHaveBeenCalledWith('waiting', 'ready')
        })
    })

    describe('Context Management', () => {
        it('should register and retrieve context', async () => {
            const testValue = { data: 'test' }
            const context: Context = {
                name: 'testContext',
                mounted: async () => testValue
            }

            dependency.register(context)
            await dependency.mounted()

            expect(dependency.use('testContext')).toEqual(testValue)
        })

        it('should throw when accessing unmounted context', () => {
            const context: Context = {
                name: 'testContext',
                mounted: async () => ({ data: 'test' })
            }

            dependency.register(context)
            expect(() => dependency.use('testContext')).toThrow()
        })

        it('should throw when accessing non-existent context', () => {
            expect(() => dependency.use('nonexistent')).toThrow()
        })

        it('should check if context is ready', async () => {
            const context: Context = {
                name: 'testContext',
                mounted: async () => ({ data: 'test' })
            }

            dependency.register(context)
            expect(dependency.contextIsReady('testContext')).toBe(false)
            await dependency.mounted()
            expect(dependency.contextIsReady('testContext')).toBe(true)
        })
    })

    describe('Event System', () => {
        it('should broadcast events to all children', () => {
            const parentListener = vi.fn()
            const childListener = vi.fn()

            dependency.on('test', parentListener)
            childDependency.on('test', childListener)

            dependency.broadcast('test', 'data')

            expect(parentListener).toHaveBeenCalledWith('data')
            expect(childListener).toHaveBeenCalledWith('data')
        })

        it('should dispatch events up the hierarchy', () => {
            const parentListener = vi.fn()
            dependency.on('test', parentListener)

            childDependency.dispatch('test', 'data')

            expect(parentListener).toHaveBeenCalledWith('data')
        })
    })

    describe('Dependency Hierarchy', () => {
        it('should find child by filename', () => {
            const found = dependency.findChild(childDependency.filename)
            expect(found).toBe(childDependency)
        })

        it('should find plugin by name', () => {
            const found = dependency.findPluginByName(childDependency.name)
            expect(found).toBe(childDependency)
        })

        it('should get all dependencies', () => {
            const allDeps = dependency.allDependencies
            expect(allDeps).toContain(childDependency)
        })

        it('should get enabled dependencies sorted by priority', () => {
            const highPriorityDep = new Dependency(dependency, 'high', 'high.ts', { priority: 2 })
            const lowPriorityDep = new Dependency(dependency, 'low', 'low.ts', { priority: 1 })

            dependency.dependencies.set(highPriorityDep.filename, highPriorityDep)
            dependency.dependencies.set(lowPriorityDep.filename, lowPriorityDep)

            const enabledDeps = dependency.getEnabledDependencies()
            expect(enabledDeps[0]).toBe(highPriorityDep)
            expect(enabledDeps[1]).toBe(lowPriorityDep)
        })
    })

    describe('Options Management', () => {
        it('should update options and emit change event', () => {
            const listener = vi.fn()
            dependency.on('options.changed', listener)

            const newOptions = { enabled: false }
            dependency.updateOptions(newOptions)

            expect(dependency.getOptions()).toMatchObject(newOptions)
            expect(listener).toHaveBeenCalledWith(newOptions)
        })
    })

    describe('Cleanup', () => {
        it('should clean up resources on dispose', () => {
            const context: Context = {
                name: 'testContext',
                mounted: async () => ({ data: 'test' }),
                dispose: vi.fn()
            }

            dependency.register(context)
            dependency.dispose()

            expect(dependency.getLifecycleState()).toBe('disposed')
            expect(dependency.dependencies.size).toBe(0)
            expect(dependency.contexts.size).toBe(0)
            expect(dependency.parent).toBeNull()
        })

        it('should dispose child dependencies', () => {
            const childDisposeSpy = vi.spyOn(childDependency, 'dispose')
            dependency.dispose()
            expect(childDisposeSpy).toHaveBeenCalled()
        })
    })
})