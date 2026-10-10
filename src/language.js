import React from 'react';
import characterMap from './zh-hans-map.json';

export const LANGUAGE_KEY = 'ac-display-language';
let displayLanguage = 'zh-HK';
export function setDisplayLanguage(language) { displayLanguage = language; }
export function simplify(text) {
  return typeof text === 'string' ? text.replace(/[\u3400-\u9fff]/g, char => characterMap[char] || char) : text;
}
export function t(text) { return displayLanguage === 'zh-CN' ? simplify(text) : text; }

// Convert presentation only: records, IDs, option values, form inputs and
// comparisons retain their original values. No DOM rewriting or data migration.
const presentationProps = ['title', 'label', 'placeholder', 'description', 'aria-label', 'alt', 'okText', 'cancelText'];
function visible(value) {
  if (typeof value === 'string') return t(value);
  if (Array.isArray(value)) return value.map(visible);
  return value;
}
function localizedOptions(options) {
  return options.map(option => typeof option === 'object' && option !== null
    ? {...option, label: visible(option.label), ...(option.options ? {options: localizedOptions(option.options)} : {})}
    : {value: option, label: visible(option)});
}
function localizedColumns(columns) {
  return columns.map(column => ({
    ...column,
    title: visible(column.title),
    ...(column.children ? {children: localizedColumns(column.children)} : {}),
    render: (value, record, index) => visible(column.render ? column.render(value, record, index) : value),
  }));
}
// JSX factory shared by this prototype's pages, including portal dialogs.
export function localizedElement(type, props, ...children) {
  if (props?.['data-language-names']) return React.createElement(type, props, ...children);
  const next = props ? {...props} : null;
  if (next) {
    for (const key of presentationProps) if (key in next) next[key] = visible(next[key]);
    if (Array.isArray(next.options)) next.options = localizedOptions(next.options);
    if (Array.isArray(next.columns)) next.columns = localizedColumns(next.columns);
  }
  return React.createElement(type, next, ...children.map(visible));
}
