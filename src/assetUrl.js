// Keep stored resource paths portable between local preview and Pages subpaths.
export function assetUrl(value, base = import.meta.env?.BASE_URL || '/') {
  return typeof value === 'string' && /^\/(resources|avatars)\//.test(value)
    ? `${base.replace(/\/?$/, '/')}${value.slice(1)}`
    : value;
}
