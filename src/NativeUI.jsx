/** @jsx localizedElement */
import React, { createContext, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Empty, Table } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { localizedElement } from './language';
import NavigationIcon from './NavigationIcon';

export const NativeLayoutContext = createContext({ host: null });
export function PageHeading({ children }) {
  const { host } = useContext(NativeLayoutContext);
  return host ? createPortal(<div className="native-page-heading">{children}</div>, host) : null;
}

export function NativeSidebar({ menu, page, nav, roleLabel }) {
  const groups = [[null, ['dashboard']], ['教學工作區', ['schedule', 'attendance']], ['教務工作區', ['teachers', 'students', 'courses', 'billing']], ['教學資源庫', ['audio', 'video', 'questions', 'papers']]];
  return <aside className="native-sidebar">
    <div className="native-app-identity"><span className="native-app-icon">ac.</span><div><b>AC Education</b><small>教務工作室</small></div></div>
    <nav aria-label="主要導覽">{groups.map(([label, keys]) => <section key={label || 'overview'}>{label && <h2>{label}</h2>}{menu.filter(m => keys.includes(m.key)).map(m => <button key={m.key} className={page === m.key ? 'selected' : ''} aria-current={page === m.key ? 'page' : undefined} title={m.label} aria-label={m.label} onClick={() => nav(m.key)}><span className={'native-nav-icon icon-' + m.key}><NavigationIcon name={m.key} /></span><span className="native-nav-label">{m.label}</span>{m.count > 0 && <em>{m.count}</em>}</button>)}</section>)}</nav>
    <div className="native-account"><div><b>{roleLabel}</b><small>本機資料 · 香港</small></div></div>
  </aside>;
}

export function NativeToolbar({ setHost, language, onLanguageChange }) {
  return <header className="native-toolbar">
    <div className="native-title-slot" ref={setHost} />
    <div className="native-toolbar-settings"><Button data-language-names="true" type="text" icon={<NavigationIcon name="language" />} aria-label={language === 'zh-CN' ? '切换为繁体中文' : '切換為簡體中文'} title={language === 'zh-CN' ? '简体中文 · 点击切换为繁体中文' : '繁體中文 · 點擊切換為簡體中文'} onClick={() => onLanguageChange(language === 'zh-CN' ? 'zh-HK' : 'zh-CN')} /></div>
  </header>;
}

// Finder-style list and inspector: record actions live with the selected record.
export function NativeRecordTable({ rows, cols, tableProps = {} }) {
  const [selectedId, setSelectedId] = useState(null);
  const { key: tableKey, inspectorTitle, ...forwardedProps } = tableProps;
  const selected = rows.find(r => r.id === selectedId) || rows[0];
  const actionNames = ['操作', '處理'];
  const dataCols = cols.filter(c => !actionNames.includes(c.title));
  const actions = cols.filter(c => actionNames.includes(c.title));
  const identityCol = dataCols.find(c => c.title === inspectorTitle) || dataCols[0];
  const detailCols = dataCols.filter(c => c !== identityCol);
  const cell = (col, row) => col.render ? col.render(col.dataIndex ? row[col.dataIndex] : undefined, row) : row[col.dataIndex];
  return <div className="native-record-browser">
    <div className="native-record-list"><Table size="small" rowKey="id" dataSource={rows} columns={dataCols} pagination={rows.length > 8 ? {pageSize:8,showSizeChanger:false} : false} scroll={{x:480}} locale={{emptyText:<Empty description="暫時沒有記錄" image={Empty.PRESENTED_IMAGE_SIMPLE} />}} {...forwardedProps}
      onChange={(pagination, filters, sorter, extra) => {
        const offset = ((pagination.current || 1) - 1) * (pagination.pageSize || 8);
        setSelectedId(extra.currentDataSource[offset]?.id ?? null);
        tableProps.onChange?.(pagination, filters, sorter, extra);
      }}
      rowClassName={row => row.id === selected?.id ? 'native-row-selected' : ''}
      onRow={row => ({onClick:() => setSelectedId(row.id), tabIndex:0, 'aria-selected':row.id === selected?.id,
        onKeyDown:e => { if (['Enter',' '].includes(e.key)) { e.preventDefault(); setSelectedId(row.id); } }})} />
      <div className="native-list-status">{rows.length} 項記錄 <span>選擇一列查看詳情</span></div>
    </div>
    {selected && <aside className="native-inspector"><div className="native-inspector-title"><InfoCircleOutlined /><b>記錄詳情</b></div><div className="native-inspector-identity"><div>{identityCol && cell(identityCol, selected)}</div></div><div className="native-inspector-fields">{detailCols.map((col, i) => <div key={i}><span>{col.title}</span><div>{cell(col, selected)}</div></div>)}</div>{actions.length > 0 && <div className="native-inspector-actions">{actions.map((col,i) => <React.Fragment key={i}>{cell(col,selected)}</React.Fragment>)}</div>}</aside>}
  </div>;
}
