const UNDEF_MARKER = "__UNDEFINED__";

export function replaceUndefined<T>(input: T): T {
  if (input === undefined) return UNDEF_MARKER as unknown as T;
  if (Array.isArray(input)) {
    return input.map(replaceUndefined) as unknown as T;
  } else if (typeof input === "object" && input !== null) {
    const result: any = {};
    for (const [k, v] of Object.entries(input)) {
      result[k] = v === undefined ? UNDEF_MARKER : replaceUndefined(v);
    }
    return result;
  }
  return input;
}

export function restoreUndefined<T>(input: T): T | undefined {
  if (input === UNDEF_MARKER) return undefined;
  if (Array.isArray(input)) {
    return input.map(restoreUndefined) as unknown as T;
  } else if (typeof input === "object" && input !== null) {
    const result: any = {};
    for (const [k, v] of Object.entries(input)) {
      result[k] = v === UNDEF_MARKER ? undefined : restoreUndefined(v);
    }
    return result;
  }
  return input;
}

export function flat(obj: unknown): Record<string, unknown>[] {
  if (obj === undefined) {
    throw new Error("Input to flat must not contain undefined. Use replaceUndefined beforehand.");
  }

  if (typeof obj !== 'object' || obj === null) {
    return [{ "": obj }];
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return [{ "@": [] }];
    return obj.flatMap((val, i) => {
      if (Array.isArray(val) && val.length === 0) {
        return [{ [`@${i}@`]: [] }];
      }
      return flat(val).map(e => {
        const [k, v] = Object.entries(e)[0];
        return { [`@${i}${k}`]: v };
      });
    });
  }

  if (typeof obj === 'object') {
    if (Object.keys(obj).length === 0) return [{ ".": {} }];
    return Object.entries(obj).flatMap(([k, v]) => flat(v).map(e => {
      const [subk, subv] = Object.entries(e)[0];
      return { [`.${k}${subk}`]: subv };
    }));
  }

  throw new Error("Unhandled input in flat function.");
}

export function unflat(entries: Record<string, unknown>[]): unknown {
  if (entries.length === 1 && entries[0][""] !== undefined) return entries[0][""];
  if (entries.length === 1 && "." in entries[0]) return {};
  if (entries.length === 1 && "@" in entries[0]) return [];

  // Group entries by their root segment
  const groups = new Map<string, Record<string, unknown>[]>();

  for (const entry of entries) {
    const [path, value] = Object.entries(entry)[0];

    // Extract the root segment
    let rootSegment: string;
    let remainingPath: string;

    if (path.startsWith('.')) {
      // Property access: .prop or .prop.more or .prop@0 etc
      const match = path.match(/^(\.[^.\@]+)(.*)/);
      if (match) {
        rootSegment = match[1];
        remainingPath = match[2];
      } else {
        // Handle standalone '.'
        rootSegment = '.';
        remainingPath = '';
      }
    } else if (path.startsWith('@')) {
      // Array access: @0 or @0.more etc
      const match = path.match(/^(@\d*)(.*)/);
      if (match) {
        rootSegment = match[1];
        remainingPath = match[2];
      } else {
        // Handle standalone '@'
        rootSegment = '@';
        remainingPath = '';
      }
    } else if (path === '') {
      // Direct value assignment with empty string
      rootSegment = '';
      remainingPath = '';
    } else {
      // Other cases
      rootSegment = path;
      remainingPath = '';
    }

    if (!groups.has(rootSegment)) {
      groups.set(rootSegment, []);
    }

    // Create new entry with remaining path
    if (remainingPath === '') {
      groups.get(rootSegment)!.push({ "": value });
    } else {
      groups.get(rootSegment)!.push({ [remainingPath]: value });
    }
  }

  // Determine if result should be an array or object
  const hasArrayIndices = Array.from(groups.keys()).some(key => key.startsWith('@') && key !== '@');
  const hasProperties = Array.from(groups.keys()).some(key => key.startsWith('.') && key !== '.');

  if (hasArrayIndices && !hasProperties) {
    // Pure array
    const result: any[] = [];
    for (const [rootSegment, subEntries] of groups) {
      if (rootSegment.startsWith('@') && rootSegment !== '@') {
        const index = parseInt(rootSegment.slice(1), 10);
        result[index] = unflat(subEntries);
      } else if (rootSegment === '@') {
        // Empty array marker
        return [];
      }
    }
    return result;
  } else {
    // Object (or mixed, treat as object)
    const result: any = {};
    for (const [rootSegment, subEntries] of groups) {
      if (rootSegment.startsWith('.') && rootSegment !== '.') {
        const key = rootSegment.slice(1);
        result[key] = unflat(subEntries);
      } else if (rootSegment.startsWith('@') && rootSegment !== '@') {
        // Mixed case: object with numeric array-like properties
        const index = rootSegment.slice(1);
        result[index] = unflat(subEntries);
      } else if (rootSegment === '.') {
        // Empty object marker - should be handled by early return
      } else if (rootSegment === '@') {
        // Handle empty array in mixed context
        result[rootSegment] = [];
      }
    }
    return result;
  }
}

export function sortKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sortKeys(item));
  }

  const result: Record<string, unknown> = {};
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  
  for (const key of keys) {
    result[key] = sortKeys((obj as Record<string, unknown>)[key]);
  }
  
  return result;
}

type DiffOperation =
  | { type: 'add'; path: string; value: unknown }
  | { type: 'remove'; path: string }
  | { type: 'set'; path: string; value: unknown };

function getType(value: unknown): 'null' | 'array' | 'object' | 'primitive' {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return 'primitive';
}

function diffInternal(a: unknown, b: unknown, path: string, arrayReplace: boolean): DiffOperation[] {
  const operations: DiffOperation[] = [];

  // Handle undefined by converting to marker
  const processedA = replaceUndefined(a);
  const processedB = replaceUndefined(b);

  const typeA = getType(processedA);
  const typeB = getType(processedB);

  // If types are different, use SET operation
  if (typeA !== typeB) {
    const finalPath = path === '' ? '' : path;
    operations.push({
      type: 'set',
      path: finalPath,
      value: restoreUndefined(processedB)
    });
    return operations;
  }

  // Both are primitives or null
  if (typeA === 'primitive' || typeA === 'null') {
    if (processedA !== processedB) {
      const finalPath = path === '' ? '' : path;
      operations.push({
        type: 'set',
        path: finalPath,
        value: restoreUndefined(processedB)
      });
    }
    return operations;
  }

  // Both are objects (not arrays)
  if (typeA === 'object') {
    const objA = processedA as Record<string, unknown>;
    const objB = processedB as Record<string, unknown>;

    const keysA = new Set(Object.keys(objA));
    const keysB = new Set(Object.keys(objB));

    // Get all unique keys sorted
    const allKeys = new Set([...keysA, ...keysB]);
    const sortedKeys = Array.from(allKeys).sort();

    for (const key of sortedKeys) {
      const inA = keysA.has(key);
      const inB = keysB.has(key);
      const newPath = path === '' ? `.${key}` : `${path}.${key}`;

      if (!inA && inB) {
        // Key in B but not in A - ADD
        const flatValue = flat(replaceUndefined(objB[key]));
        for (const entry of flatValue) {
          const [subPath, value] = Object.entries(entry)[0];
          const fullPath = subPath === '' ? newPath : `${newPath}${subPath}`;
          operations.push({
            type: 'add',
            path: fullPath,
            value: restoreUndefined(value)
          });
        }
      } else if (inA && !inB) {
        // Key in A but not in B - REMOVE
        operations.push({
          type: 'remove',
          path: newPath
        });
      } else if (inA && inB) {
        // Keys in both - recurse
        operations.push(...diffInternal(objA[key], objB[key], newPath, arrayReplace));
      }
    }

    return operations;
  }

  // Both are arrays
  if (typeA === 'array') {
    const arrA = processedA as unknown[];
    const arrB = processedB as unknown[];

    // If arrayReplace is true and lengths differ, replace entire array
    if (arrayReplace && arrA.length !== arrB.length) {
      const finalPath = path === '' ? '' : path;
      operations.push({
        type: 'set',
        path: finalPath,
        value: restoreUndefined(processedB)
      });
      return operations;
    }

    // Simple strategy: compare element by element
    const maxLen = Math.max(arrA.length, arrB.length);

    for (let i = 0; i < maxLen; i++) {
      const newPath = path === '' ? `@${i}` : `${path}@${i}`;

      if (i >= arrA.length) {
        // Element exists in B but not in A - ADD
        const flatValue = flat(replaceUndefined(arrB[i]));
        for (const entry of flatValue) {
          const [subPath, value] = Object.entries(entry)[0];
          const fullPath = subPath === '' ? newPath : `${newPath}${subPath}`;
          operations.push({
            type: 'add',
            path: fullPath,
            value: restoreUndefined(value)
          });
        }
      } else if (i >= arrB.length) {
        // Element exists in A but not in B - REMOVE
        operations.push({
          type: 'remove',
          path: newPath
        });
      } else {
        // Both exist - recurse
        operations.push(...diffInternal(arrA[i], arrB[i], newPath, arrayReplace));
      }
    }

    return operations;
  }

  return operations;
}

export function diff(a: unknown, b: unknown, arrayReplace: boolean = false): DiffOperation[] {
  return diffInternal(a, b, '', arrayReplace);
}

export function apply(input: unknown, operations: DiffOperation[]): unknown {
  // Step 1: Sort keys and flatten the input object
  const sorted = sortKeys(input);
  const flattened = flat(replaceUndefined(sorted));
  
  // Step 2: Convert to map for easier manipulation
  const pathMap = new Map<string, unknown>();
  
  for (const entry of flattened) {
    const [path, value] = Object.entries(entry)[0];
    pathMap.set(path, value);
  }
  
  // Step 3: Apply each operation in sequence
  for (const operation of operations) {
    switch (operation.type) {
      case 'add':
        pathMap.set(operation.path, replaceUndefined(operation.value));
        break;

      case 'set':
        // First, remove all child paths that start with this path
        const pathsToRemoveForSet: string[] = [];
        for (const [existingPath] of pathMap.entries()) {
          if (existingPath === operation.path ||
              existingPath.startsWith(operation.path + '.') ||
              existingPath.startsWith(operation.path + '@')) {
            pathsToRemoveForSet.push(existingPath);
          }
        }

        for (const pathToRemove of pathsToRemoveForSet) {
          pathMap.delete(pathToRemove);
        }

        // Then, flatten the new value and add all its paths
        const flatValue = flat(replaceUndefined(operation.value));
        for (const entry of flatValue) {
          const [subPath, value] = Object.entries(entry)[0];
          const fullPath = subPath === '' ? operation.path :
                          operation.path === '' ? subPath : `${operation.path}${subPath}`;
          pathMap.set(fullPath, value);
        }
        break;

      case 'remove':
        // Remove the path itself
        pathMap.delete(operation.path);

        // Also remove all child paths that start with this path
        const pathsToRemove: string[] = [];
        for (const [existingPath] of pathMap.entries()) {
          if (existingPath.startsWith(operation.path + '.') ||
              existingPath.startsWith(operation.path + '@')) {
            pathsToRemove.push(existingPath);
          }
        }

        for (const pathToRemove of pathsToRemove) {
          pathMap.delete(pathToRemove);
        }
        break;
    }
  }
  
  // Step 4: Preserve empty structures from the original input
  // Collect all structure paths from the original input
  const originalStructures = new Set<string>();
  
  for (const entry of flattened) {
    const [path] = Object.entries(entry)[0];
    
    // If this is already an empty structure marker, add it
    if (path.endsWith('.') || path.endsWith('@')) {
      originalStructures.add(path);
    }
    
    // For non-empty paths, extract all possible parent structure paths
    let currentPath = '';
    let i = 0;
    
    while (i < path.length) {
      const char = path[i];
      
      if (char === '.') {
        // Found an object property separator
        if (currentPath !== '') {
          originalStructures.add(currentPath + '.');
        }
        currentPath += char;
      } else if (char === '@') {
        // Found an array index start
        if (currentPath !== '') {
          originalStructures.add(currentPath + '@');
        }
        // Skip to the end of the number
        currentPath += char;
        i++;
        while (i < path.length && /\d/.test(path[i])) {
          currentPath += path[i];
          i++;
        }
        i--; // Back up one since the loop will increment
      } else {
        currentPath += char;
      }
      
      i++;
    }
  }
  
  // Handle conflicts between empty markers and actual content
  // Remove empty markers when there are actual properties/elements
  for (const [path] of pathMap.entries()) {
    if (path.endsWith('@') || path.endsWith('.')) {
      const prefix = path.slice(0, -1); // Remove the trailing marker
      const hasProperties = Array.from(pathMap.keys()).some(p => 
        p !== path && p.startsWith(prefix) && (p.includes('.') || p.includes('@'))
      );
      
      if (hasProperties) {
        pathMap.delete(path); // Remove empty marker when there are actual elements
      }
    }
  }
  
  // Add empty markers for structures that existed in input but have no properties after operations
  for (const structurePath of originalStructures) {
    if (structurePath.endsWith('.') || structurePath.endsWith('@')) {
      const prefix = structurePath.slice(0, -1); // Remove the trailing marker
      const hasProperties = Array.from(pathMap.keys()).some(p => 
        p !== structurePath && p.startsWith(prefix) && (p.includes('.') || p.includes('@'))
      );
      
      if (!hasProperties && !pathMap.has(structurePath)) {
        pathMap.set(structurePath, 0);
      }
    }
  }
  
  // Step 5: Convert back to object format and unflatten
  const resultEntries: Record<string, unknown>[] = [];
  for (const [path, value] of pathMap.entries()) {
    resultEntries.push({ [path]: value });
  }
  
  // Step 6: Unflatten and restore undefined values
  const unflattened = unflat(resultEntries);
  return restoreUndefined(unflattened);
}