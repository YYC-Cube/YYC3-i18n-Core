// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * Storage Mock for Testing
 */

export function createStorageMock(): Storage {
    const store: Record<string, string> = {};

    return {
        getItem(key: string): string | null {
            return store[key] ?? null;
        },

        setItem(key: string, value: string): void {
            store[key] = value;
        },

        removeItem(key: string): void {
            delete store[key];
        },

        clear(): void {
            Object.keys(store).forEach(key => delete store[key]);
        },

        get key(): number {
            return Object.keys(store).length;
        },

        get length(): number {
            return Object.keys(store).length;
        }
    } as unknown as Storage;
}

// ============================================================
// End of storage.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
