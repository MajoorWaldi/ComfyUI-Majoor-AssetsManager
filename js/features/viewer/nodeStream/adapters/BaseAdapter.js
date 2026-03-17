/**
 * BaseAdapter — interface contract for Node Stream adapters.
 *
 * Every adapter must implement:
 *   - name        {string}   Unique identifier
 *   - priority    {number}   Higher = matched first (default 0)
 *   - description {string}   Human-readable label for UI
 *   - canHandle(classType, outputs) → boolean
 *   - extractMedia(classType, outputs, nodeId) → FileData[] | null
 *
 * FileData shape:
 *   { filename, subfolder, type, kind?, _nodeId?, _classType? }
 *
 * @typedef {{
 *   name: string,
 *   priority: number,
 *   description: string,
 *   canHandle: (classType: string, outputs: object) => boolean,
 *   extractMedia: (classType: string, outputs: object, nodeId: string) => Array<{filename:string, subfolder:string, type:string, kind?:string}> | null,
 * }} NodeStreamAdapter
 */

/**
 * Create an adapter from a plain config object.
 * Fills in defaults for optional fields.
 * @param {Partial<NodeStreamAdapter> & {name: string}} config
 * @returns {NodeStreamAdapter}
 */
export function createAdapter(config) {
    return {
        priority: 0,
        description: "",
        canHandle: () => false,
        extractMedia: () => null,
        ...config,
    };
}
