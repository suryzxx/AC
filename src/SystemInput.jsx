/** @jsx localizedElement */
import React from 'react';
import { Input, DatePicker, TimePicker } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/zh-hk';
import { localizedElement, t } from './language';

// Keep existing string-based form values while replacing browser-native popups.
function SystemInput({ type, value, onChange, onInput, min, max, pattern, ...props }) {
  if (type !== 'time' && type !== 'date') return <Input {...props} type={type} value={value} onChange={onChange} onInput={onInput} min={min} max={max} pattern={pattern} />;
  const isTime = type === 'time';
  const parse = text => text ? dayjs(isTime ? `2000-01-01T${text}:00` : text).locale(t('週') === '周' ? 'zh-cn' : 'zh-hk') : null;
  const selected = parse(value);
  const Picker = isTime ? TimePicker : DatePicker;
  return <Picker {...props} className={`system-temporal-input ${props.className || ''}`} value={selected?.isValid() ? selected : null}
    format={isTime ? 'HH:mm' : 'YYYY-MM-DD'} allowClear={false} needConfirm={false}
    placeholder={props.placeholder || (isTime ? '選擇時間' : '選擇日期')}
    {...(isTime ? { showNow: false } : { minDate: parse(min), maxDate: parse(max) })}
    onChange={(_, text) => onChange?.({ target: { value: text }, currentTarget: { value: text } })} />;
}
SystemInput.TextArea = Input.TextArea;
SystemInput.Search = Input.Search;
SystemInput.Password = Input.Password;
export default SystemInput;
