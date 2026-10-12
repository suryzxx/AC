/** @jsx localizedElement */
import React, { useState } from 'react';
import { Button, Upload, Alert } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { localizedElement } from './language';

export function TeacherAvatar({ teacher, large = false }) {
  const avatar = teacher.avatar?.startsWith('/avatars/') ? `${import.meta.env.BASE_URL}${teacher.avatar.slice(1)}` : teacher.avatar;
  return <span className={`avatar teacher-avatar${large ? ' teacher-avatar-large' : ''}`} style={{ background: (teacher.color || '#4977c8') + '18', color: teacher.color || '#4977c8' }}>{teacher.avatar ? <img src={avatar} alt={`${teacher.name || '老師'}的頭像`} /> : teacher.name?.[0] || '師'}</span>;
}

export default function TeacherAvatarEditor({ teacher, onChange, busy, onBusy }) {
  const [error, setError] = useState('');
  const choose = async file => {
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('請選擇 JPG、PNG 或 WebP 圖片');
      return Upload.LIST_IGNORE;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('圖片不可超過 10 MB');
      return Upload.LIST_IGNORE;
    }
    onBusy(true);
    const url = URL.createObjectURL(file);
    try {
      const picture = new Image();
      picture.src = url;
      await picture.decode();
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 256;
      const context = canvas.getContext('2d');
      const side = Math.min(picture.naturalWidth, picture.naturalHeight);
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, 256, 256);
      context.drawImage(picture, (picture.naturalWidth - side) / 2, (picture.naturalHeight - side) / 2, side, side, 0, 0, 256, 256);
      onChange(canvas.toDataURL('image/jpeg', 0.85));
    } catch {
      setError('無法讀取這張圖片，請選擇其他圖片');
    } finally {
      URL.revokeObjectURL(url);
      onBusy(false);
    }
    return Upload.LIST_IGNORE;
  };
  return <div className="teacher-avatar-editor"><div className="teacher-avatar-controls"><TeacherAvatar teacher={teacher} large /><div><div className="actions"><Upload accept="image/jpeg,image/png,image/webp" showUploadList={false} beforeUpload={choose} disabled={busy}><Button icon={<UploadOutlined />} loading={busy}>{teacher.avatar ? '更換頭像' : '上傳頭像'}</Button></Upload>{teacher.avatar && <Button disabled={busy} onClick={() => { onChange(''); setError(''); }}>移除頭像</Button>}</div><p className="muted">JPG、PNG、WebP，最大 10 MB。圖片將以圓形顯示，儲存後生效。</p></div></div>{error && <Alert type="error" title={error} />}</div>;
}
