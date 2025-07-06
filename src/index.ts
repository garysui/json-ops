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
    if (obj.length === 0) return [{ "[]": 0 }];
    return obj.flatMap((val, i) => {
      if (Array.isArray(val) && val.length === 0) {
        return [{ [`[${i}][]`]: 0 }];
      }
      return flat(val).map(e => {
        const [k, v] = Object.entries(e)[0];
        return { [`[${i}]${k}`]: v };
      });
    });
  }

  if (typeof obj === 'object') {
    if (Object.keys(obj).length === 0) return [{ ".": 0 }];
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
  if (entries.length === 1 && "[]" in entries[0]) return [];

  // Group entries by their root segment
  const groups = new Map<string, Record<string, unknown>[]>();

  for (const entry of entries) {
    const [path, value] = Object.entries(entry)[0];

    // Extract the root segment
    let rootSegment: string;
    let remainingPath: string;

    if (path.startsWith('.')) {
      // Property access: .prop or .prop.more or .prop[0] etc
      const match = path.match(/^(\.[^.\[]+)(.*)/);
      if (match) {
        rootSegment = match[1];
        remainingPath = match[2];
      } else {
        // Handle standalone '.'
        rootSegment = '.';
        remainingPath = '';
      }
    } else if (path.startsWith('[')) {
      // Array access: [0] or [0].more etc
      const match = path.match(/^(\[\d+\])(.*)/);
      if (match) {
        rootSegment = match[1];
        remainingPath = match[2];
      } else {
        // Handle standalone '[]'
        rootSegment = '[]';
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
  const hasArrayIndices = Array.from(groups.keys()).some(key => key.startsWith('[') && key !== '[]');
  const hasProperties = Array.from(groups.keys()).some(key => key.startsWith('.') && key !== '.');

  if (hasArrayIndices && !hasProperties) {
    // Pure array
    const result: any[] = [];
    for (const [rootSegment, subEntries] of groups) {
      if (rootSegment.startsWith('[') && rootSegment !== '[]') {
        const index = parseInt(rootSegment.slice(1, -1), 10);
        result[index] = unflat(subEntries);
      } else if (rootSegment === '[]') {
        // This shouldn't happen in a pure array context
        result.push([]);
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
      } else if (rootSegment === '.') {
        // Empty object marker - should be handled by early return
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

export function diff(a: unknown, b: unknown): DiffOperation[] {
  // Step 1: Sort keys for both objects
  const sortedA = sortKeys(a);
  const sortedB = sortKeys(b);
  
  // Step 2: Flatten both sorted objects
  const flatA = flat(replaceUndefined(sortedA));
  const flatB = flat(replaceUndefined(sortedB));
  
  // Step 3: Convert to maps for easier comparison
  const mapA = new Map<string, unknown>();
  const mapB = new Map<string, unknown>();
  
  for (const entry of flatA) {
    const [path, value] = Object.entries(entry)[0];
    mapA.set(path, value);
  }
  
  for (const entry of flatB) {
    const [path, value] = Object.entries(entry)[0];
    mapB.set(path, value);
  }
  
  // Step 4: Compare and generate operations with optimizations
  const operations: DiffOperation[] = [];
  const allPaths = new Set([...mapA.keys(), ...mapB.keys()]);
  
  // Detect transitions to optimize operations
  const emptyToFilledOptimizations = new Set<string>();
  const filledToEmptyOptimizations = new Set<string>();
  
  for (const path of allPaths) {
    // Check if this is an empty object/array marker being removed while properties are added
    if (path.endsWith('.') || path.endsWith('[]')) {
      const prefix = path.slice(0, -1); // Remove the trailing marker
      const hasRemovedEmpty = mapA.has(path) && !mapB.has(path);
      const hasAddedEmpty = !mapA.has(path) && mapB.has(path);
      const hasAddedProperties = Array.from(mapB.keys()).some(p => 
        p !== path && p.startsWith(prefix) && !mapA.has(p)
      );
      const hasRemovedProperties = Array.from(mapA.keys()).some(p => 
        p !== path && p.startsWith(prefix) && !mapB.has(p)
      );
      
      // Empty-to-filled: skip removing empty marker when adding properties
      if (hasRemovedEmpty && hasAddedProperties) {
        emptyToFilledOptimizations.add(path);
      }
      
      // Filled-to-empty: skip adding empty marker when removing all properties
      if (hasAddedEmpty && hasRemovedProperties && !hasAddedProperties) {
        filledToEmptyOptimizations.add(path);
      }
    }
  }
  
  for (const path of Array.from(allPaths).sort()) {
    // Skip empty markers that are being optimized away
    if (emptyToFilledOptimizations.has(path) || filledToEmptyOptimizations.has(path)) {
      continue;
    }
    
    const valueA = mapA.get(path);
    const valueB = mapB.get(path);
    
    if (valueA === undefined && valueB !== undefined) {
      // Path exists in B but not in A - ADD
      operations.push({
        type: 'add',
        path,
        value: restoreUndefined(valueB)
      });
    } else if (valueA !== undefined && valueB === undefined) {
      // Path exists in A but not in B - REMOVE
      operations.push({
        type: 'remove',
        path
      });
    } else if (valueA !== undefined && valueB !== undefined && valueA !== valueB) {
      // Path exists in both but with different values - SET
      operations.push({
        type: 'set',
        path,
        value: restoreUndefined(valueB)
      });
    }
    // If valueA === valueB, no operation needed
  }
  
  return operations;
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
        pathMap.set(operation.path, replaceUndefined(operation.value));
        break;
      
      case 'remove':
        pathMap.delete(operation.path);
        break;
    }
  }
  
  // Step 4: Preserve empty structures from the original input
  // Collect all structure paths from the original input
  const originalStructures = new Set<string>();
  
  for (const entry of flattened) {
    const [path] = Object.entries(entry)[0];
    
    // If this is already an empty structure marker, add it
    if (path.endsWith('.') || path.endsWith('[]')) {
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
      } else if (char === '[') {
        // Found an array index start
        if (currentPath !== '') {
          originalStructures.add(currentPath + '[]');
        }
        // Skip to the closing bracket
        while (i < path.length && path[i] !== ']') {
          currentPath += path[i];
          i++;
        }
        if (i < path.length) {
          currentPath += path[i]; // Add the closing ]
        }
      } else {
        currentPath += char;
      }
      
      i++;
    }
  }
  
  // Add empty markers for structures that existed in input but have no properties after operations
  for (const structurePath of originalStructures) {
    if (structurePath.endsWith('.') || structurePath.endsWith('[]')) {
      const prefix = structurePath.slice(0, -1); // Remove the trailing marker
      const hasProperties = Array.from(pathMap.keys()).some(p => 
        p !== structurePath && p.startsWith(prefix) && (p.includes('.') || p.includes('['))
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