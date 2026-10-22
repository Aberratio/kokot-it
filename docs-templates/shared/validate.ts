// Type checks shared by the validators of the private files the documents are rendered from
// (CV content, price quotes): they are a trust boundary, read from outside the repository.

export const isString = (v: unknown): v is string => typeof v === 'string';

export const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString);

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Problems of an array of records whose listed fields must all be strings. */
export function stringFieldProblems(
  value: unknown,
  path: string,
  fields: readonly string[],
): string[] {
  if (!Array.isArray(value)) return [`${path} must be an array`];
  return value.flatMap((item, i) => {
    const at = `${path}[${String(i)}]`;
    if (!isRecord(item)) return [`${at} must be an object`];
    return fields.filter((f) => !isString(item[f])).map((f) => `${at}.${f} must be a string`);
  });
}
