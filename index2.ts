
export function flat(obj: any): any[] {
  console.log('flatting ', JSON.stringify(obj));
  if (typeof obj !== 'object' || obj === null) {
    return [obj];
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return [{ "[]": 0 }]; // 0 is arbitray, only key matters here for empty list
    } else {
      return obj.map((e, i) => {
        const key = `[${i}]`;
        const flattenedValues = flat(e);
        return flattenedValues.map(fv => {
          if (typeof fv !== 'object' || fv === null) {
            return { [key]: fv };
          }
          else {
            const partialKey = Object.keys(fv)[0];
            return { [`${key}${partialKey}`]: fv[partialKey] }
          }
        });
      }).flat();
    }
  }

  // now the plain object case (except null)
  if (Object.keys(obj).length === 0) {
    return [{ ".": 0 }] // 0 is arbitray, only key matters here for empty object
  }

  return Object.keys(obj).map((key) => {
    const value = obj[key];
    if (typeof value !== 'object' || value === null) {
      return { [`.${key}`]: value };
    } else {
      const flattenedValues = flat(value);
      return flattenedValues.map(fv => {
        if (typeof fv !== 'object' || fv === null) {
          return { [`.${key}`]: fv };
        }
        else {
          const partialKey = Object.keys(fv)[0];
          return { [`.${key}${partialKey}`]: fv[partialKey] }
        }
      });
    }
  });
}

export function unflat(flatItems: Record<string, unknown>[]): unknown {
  console.log("unflatting", JSON.stringify(flatItems))
  const result: any = Array.isArray(flatItems) ? {} : {};

  for (const item of flatItems) {
    const [path, value] = Object.entries(item)[0];

    // Handle empty object or array markers
    if (path === "[]") return [];
    if (path === ".") return {};

    const pathSegments = path.match(/(\.\w+|\[\d+\])/g);
    if (!pathSegments) continue;

    let current = result;
    for (let i = 0; i < pathSegments.length; i++) {
      const seg = pathSegments[i];
      const isLast = i === pathSegments.length - 1;

      if (seg.startsWith('.')) {
        const key = seg.slice(1);
        if (isLast) {
          current[key] = value;
        } else {
          current[key] ??= {};
          current = current[key];
        }
      } else if (seg.startsWith('[')) {
        const index = parseInt(seg.slice(1, -1), 10);
        if (!Array.isArray(current)) {
          throw new Error(`Path expects array but found object at ${seg}`);
        }
        if (isLast) {
          current[index] = value;
        } else {
          current[index] ??= {};
          current = current[index];
        }
      }
    }
  }

  return result;
}

export function unflatOld(flattened: any[]): any {
  if (flattened.length === 0) {
    return [];
  }

  if (flattened.length === 1) {
    const item = flattened[0];

    // Handle primitives and null
    if (typeof item !== 'object' || item === null) {
      return item;
    }

    const keys = Object.keys(item);
    if (keys.length === 0) {
      return {};
    }

    const key = keys[0];
    const value = item[key];

    // Handle empty array marker
    if (key === '[]') {
      return [];
    }

    // Handle empty object marker
    if (key === '.') {
      return {};
    }

    // Handle single property object
    if (key.startsWith('.') && !key.includes('[')) {
      return { [key.slice(1)]: value };
    }

    // Handle single array element or nested array
    if (key.startsWith('[')) {
      const path = parsePath(key);
      const result: any[] = [];
      setNestedValueInArray(result, path, value);
      return result;
    }
  }

  // Determine if this is an array or object at the root level
  const isRootArray = flattened.some(item => {
    if (typeof item !== 'object' || item === null) return false;
    const keys = Object.keys(item);
    if (keys.length === 0) return false;
    const key = keys[0];
    return key.startsWith('[') && !key.startsWith('[.');
  });

  if (isRootArray) {
    // Reconstruct array
    const result: any[] = [];
    for (const item of flattened) {
      if (typeof item !== 'object' || item === null) continue;
      const keys = Object.keys(item);
      if (keys.length === 0) continue;

      const key = keys[0];
      const value = item[key];

      if (key.startsWith('[')) {
        const path = parsePath(key);
        setNestedValueInArray(result, path, value);
      }
    }
    return result;
  }

  // Reconstruct object
  const result: any = {};

  for (const item of flattened) {
    if (typeof item !== 'object' || item === null) continue;

    const keys = Object.keys(item);
    if (keys.length === 0) continue;

    const key = keys[0];
    const value = item[key];

    if (key === '[]' || key === '.') {
      continue;
    }

    // Parse nested path
    if (key.startsWith('.')) {
      const path = key.slice(1);
      setNestedValueSimple(result, path, value);
    }
  }

  return result;
}

function setNestedValueSimple(obj: any, path: string, value: any): void {
  const keys = parsePath(path);
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];

    if (!(key in current)) {
      // Check if next key is array index
      const nextKey = keys[i + 1];
      if (nextKey.startsWith('[') && nextKey.endsWith(']')) {
        current[key] = [];
      } else {
        current[key] = {};
      }
    }

    current = current[key];
  }

  const lastKey = keys[keys.length - 1];

  // Handle array index
  if (lastKey.startsWith('[') && lastKey.endsWith(']')) {
    const index = parseInt(lastKey.slice(1, -1));
    if (Array.isArray(current)) {
      current[index] = value;
    }
  } else {
    current[lastKey] = value;
  }
}

function setNestedValueInArray(arr: any[], path: string[], value: any): void {
  let current: any = arr;

  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];

    if (key.startsWith('[') && key.endsWith(']')) {
      const index = parseInt(key.slice(1, -1));

      if (current[index] === undefined) {
        // Check if next key is also an array index
        const nextKey = path[i + 1];
        if (nextKey.startsWith('[') && nextKey.endsWith(']')) {
          current[index] = [];
        } else if (nextKey === '[]') {
          current[index] = [];
        } else {
          current[index] = {};
        }
      }

      current = current[index];
    } else {
      if (!(key in current)) {
        const nextKey = path[i + 1];
        if (nextKey.startsWith('[') && nextKey.endsWith(']')) {
          current[key] = [];
        } else {
          current[key] = {};
        }
      }
      current = current[key];
    }
  }

  const lastKey = path[path.length - 1];

  if (lastKey === '[]') {
    // Handle empty array marker - the current should be set to an empty array
    if (Array.isArray(current)) {
      // This shouldn't happen in normal cases
    } else {
      // We need to replace the current location with an empty array
      // This is tricky - we need to go back up the path
      let parent: any = arr;
      for (let i = 0; i < path.length - 2; i++) {
        const key = path[i];
        if (key.startsWith('[') && key.endsWith(']')) {
          const index = parseInt(key.slice(1, -1));
          parent = parent[index];
        } else {
          parent = parent[key];
        }
      }

      const parentKey = path[path.length - 2];
      if (parentKey.startsWith('[') && parentKey.endsWith(']')) {
        const index = parseInt(parentKey.slice(1, -1));
        parent[index] = [];
      } else {
        parent[parentKey] = [];
      }
    }
  } else if (lastKey.startsWith('[') && lastKey.endsWith(']')) {
    const index = parseInt(lastKey.slice(1, -1));
    if (Array.isArray(current)) {
      current[index] = value;
    }
  } else {
    current[lastKey] = value;
  }
}

function parsePath(path: string): string[] {
  const result: string[] = [];
  let current = '';
  let inBrackets = false;

  for (let i = 0; i < path.length; i++) {
    const char = path[i];

    if (char === '[') {
      if (current.length > 0) {
        result.push(current);
        current = '';
      }
      current += char;
      inBrackets = true;
    } else if (char === ']') {
      current += char;
      if (inBrackets) {
        result.push(current);
        current = '';
        inBrackets = false;
      }
    } else if (char === '.' && !inBrackets) {
      if (current.length > 0) {
        result.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current.length > 0) {
    result.push(current);
  }

  return result;
}