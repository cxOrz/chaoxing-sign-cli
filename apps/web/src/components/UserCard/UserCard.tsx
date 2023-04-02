import React, { useState } from 'react';
import cryptojs from 'crypto-js';
import axios from 'axios';
import Delete from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useNavigate } from 'react-router-dom';
import { useLongPress } from '../../hooks/useLongPress';
import { DialogChoice } from '../../pages/Start/Start';
import { monitor_stop_api, monitor_start_api } from '../../config/api';
import styles from './UserCard.module.css';

interface UserCardProps {
  indb: IDBDatabase;
  user: UserParamsType;
  setAlert: (msg: any) => void;
  setCurrent: (target: UserParamsType) => void;
  setUser: (value: React.SetStateAction<any>) => void;
  emitDialog: (choice: DialogChoice, open: boolean) => void;
}

function UserCard(props: UserCardProps) {
  const phoneStr = `${props.user.phone.substring(0, 3)} **** **${props.user.phone.substring(9)}`;
  const navigate = useNavigate();
  const [once, setOnce] = useState(true);
  const [ref] = useLongPress((pos) => {
    handleSafariContextMenu(pos);
  }, 500);
  const [loading, setLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  // 移除用户
  const removeUser = () => {
    const request = props.indb.transaction('user', 'readwrite').objectStore('user').delete(props.user.phone);
    request.onsuccess = () => {
      console.log('用户已被移除');
      contextMenuClose();
      window.location.reload();
    };
  };

  // 弹出监听配置窗口
  const configureMonitor = () => {
    contextMenuClose();
    props.setCurrent(props.user);
    props.emitDialog(DialogChoice.CONFIG, true);
  };

  // 菜单处理
  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? {
          mouseX: event.clientX - 2,
          mouseY: event.clientY - 4,
        }
        : null,
    );
  };

  // Safari 浏览器，长按弹出菜单需要模拟
  const handleSafariContextMenu = (position: { x: number, y: number; }) => {
    setContextMenu(
      contextMenu === null
        ? {
          mouseX: position.x - 2,
          mouseY: position.y - 4,
        }
        : null,
    );
  };

  const contextMenuClose = () => {
    setContextMenu(null);
  };

  // 设置用户监听状态
  const setMonitorState = (target: UserParamsType, value: boolean) => {
    // 更新列表用户的监听状态
    props.setUser((prev: any) => {
      return prev.map((user: UserParamsType) => {
        if (user === target) {
          return { ...user, monitor: value };
        }
        return user;
      });
    });
    // 同时要将状态写入数据库
    const request = props.indb!.transaction(['user'], 'readwrite')
      .objectStore('user')
      .put({
        phone: target.phone,
        fid: target.fid,
        vc3: target.vc3,
        password: target.password,
        _uid: target._uid,
        _d: target._d,
        uf: target.uf,
        name: target.name,
        date: new Date(),
        monitor: value,
        lv: target.lv,
        config: { ...target.config }
      });
    request.onerror = () => { console.log('写入失败'); };
    request.onsuccess = () => { console.log('写入成功'); };
  };

  // 开<=>关
  const toggleMonitor = async () => {
    setLoading(true);
    let reqData: any, reqAPI: string;
    if (props.user.monitor) {
      reqAPI = monitor_stop_api;
    } else {
      reqAPI = monitor_start_api;
      const payload = JSON.stringify({
        credentials: {
          phone: props.user.phone,
          uf: props.user.uf,
          _d: props.user._d,
          vc3: props.user.vc3,
          uid: props.user._uid,
          lv: props.user.lv,
          fid: props.user.fid
        },
        config: { ...props.user.config }
      });
      reqData = cryptojs.enc.Utf8.parse(payload).toString(cryptojs.enc.Base64);
    }
    const { data: result } = await axios.post(`${reqAPI}/${props.user.phone}`, reqData);
    switch (result.code) {
      case 200: {
        setMonitorState(props.user, true); break;
      }
      case 201: {
        setMonitorState(props.user, false); break;
      }
      case 202: {
        setMonitorState(props.user, false);
        props.setAlert({ open: true, message: '身份过期' });
      }
    }
    setLoading(false);
  };

  const debounced = (fn: () => void, delay: number) => {
    let timeout: any = null;
    return function () {
      if (once) {
        fn();
        setOnce(false);
        return;
      }
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(fn, delay);
    };
  };

  const debouncedSetMonitor = debounced(toggleMonitor, 500);

  const handleMonitorChange = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    e.stopPropagation();
    debouncedSetMonitor();
  };

  return (
    <Card
      sx={{
        display: 'inline-block',
        maxWidth: 345,
        minWidth: 300,
        backgroundColor: '#ecf0f3',
        marginBottom: 3.5,
        marginRight: 3.5,
        verticalAlign: 'bottom'
      }}
      ref={ref}
      onContextMenu={handleContextMenu}
      className={styles.neumCard}
    >
      <CardActionArea onClick={() => { navigate('/dash/' + props.user.phone); }}>
        <CardContent sx={{ position: 'relative' }}>
          <Typography variant="h5" align='left' component="div">
            <span className={styles.name}>{props.user.name}</span>
            <p>{phoneStr}</p>
          </Typography>
          <Typography sx={{ color: 'rgb(73, 85, 105)' }} variant="body2" align='right'>
            凭证日期：{new Date(props.user.date).toLocaleString()}
          </Typography>
          <span className={styles.monitorBtn + ' ' + (props.user.monitor === true ? styles.active : styles.inactive)}
            onClick={handleMonitorChange}
          >
            {loading ? '加载中' : props.user.monitor === true ? '监听' : '未监听'}
          </span>
        </CardContent>
      </CardActionArea>
      <Menu
        open={contextMenu !== null}
        onClose={contextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined
        }
      >
        <MenuItem onClick={removeUser}>
          <ListItemIcon>
            <Delete />
          </ListItemIcon>
          <ListItemText>移除</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={configureMonitor}>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText>监听配置</ListItemText>
        </MenuItem>
      </Menu>
    </Card >
  );
}

export default UserCard;