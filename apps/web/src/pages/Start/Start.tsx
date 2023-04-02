import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AddCircleOutlineOutlined from '@mui/icons-material/AddCircleOutlineOutlined';
import ButtonBase from '@mui/material/ButtonBase';
import Icon from '@mui/material/Icon';
import Dialog from '@mui/material/Dialog';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import UserCard from '../../components/UserCard/UserCard';
import { login_api, monitor_status_api } from '../../config/api';
import styles from './Start.module.css';
import { RenderConfig, RenderLogin } from './ConfigDialog';

type UserListType = UserParamsType[];

export enum DialogChoice {
  LOGIN = 'LOGIN',
  CONFIG = 'CONFIG'
}

export const defaultConfig: UserConfig = {
  monitor: {
    delay: 0,
    lon: '113.516288',
    lat: '34.817038',
    address: ''
  },
  mailing: {
    enabled: false,
    host: 'smtp.qq.com',
    ssl: true,
    port: 465,
    user: 'sender@qq.com',
    pass: '',
    to: 'receiver@qq.com'
  },
  cqserver: {
    cq_enabled: false,
    ws_url: 'ws://127.0.0.1:8080',
    target_type: 'private',
    target_id: 1001
  }
};

function Start() {
  const [indb, setIndb] = useState<IDBDatabase>();
  const [open, setOpen] = useState(false);
  const [dialogChoice, setDialogChoice] = useState(DialogChoice.LOGIN);
  const [alert, setAlert] = useState({ open: false, message: '' });
  const [user, setUser] = useState<UserListType>([]);
  const [loaded, setLoaded] = useState(false);
  const [current, setCurrent] = useState<UserParamsType>();

  const login = async (phone: string, password: string) => {
    const res = await axios.post(login_api, {
      phone: phone,
      password: password
    });
    // 登陆成功
    if (res.data !== 'AuthFailed') {
      setOpen(false);
      // 写入数据库
      const request = indb!.transaction(['user'], 'readwrite')
        .objectStore('user')
        .put({
          phone,
          password,
          name: res.data.name, // 姓名
          _uid: res.data._uid,
          uf: res.data.uf,
          vc3: res.data.vc3,
          _d: res.data._d,
          fid: res.data.fid,
          lv: res.data.lv,
          date: new Date(), // 判断时间进行重新认证身份
          monitor: false, // 监听启用状态
          config: defaultConfig // 默认配置
        });
      request.onerror = () => { console.log('用户写入失败'); };
      request.onsuccess = () => {
        console.log('用户写入成功');
        window.location.reload();
      };
    }
    else {
      setAlert({ open: true, message: '登陆失败' });
    }
  };

  // 根据参数设置弹出对话框
  const emitDialog = (choice: DialogChoice, open: boolean) => {
    setDialogChoice(choice);
    setOpen(open);
  };

  // 将配置写入目标用户下
  const storeConfig = (target: UserParamsType, config: UserConfig) => {
    const request = indb!.transaction(['user'], 'readwrite')
      .objectStore('user')
      .put({
        phone: target.phone,
        password: target.password,
        name: target.name,
        _uid: target._uid,
        uf: target.uf,
        vc3: target.vc3,
        _d: target._d,
        fid: target.fid,
        lv: target.lv,
        date: target.date,
        monitor: target.monitor,
        config
      });
    request.onerror = () => { console.log('配置写入失败'); };
    request.onsuccess = () => { console.log('配置写入成功'); };
    setUser(prev => prev.map(user => {
      if (user === target) {
        return {
          ...user,
          config: {
            monitor: { ...config.monitor },
            mailing: { ...config.mailing },
            cqserver: { ...config.cqserver },
          }
        };
      }
      return user;
    }));
    setOpen(false);
  };

  useEffect(() => {
    // 打开或创建数据库
    const request = window.indexedDB.open('ui');
    request.onerror = () => {
      console.log('数据库打开失败');
    };
    // 打开成功
    request.onsuccess = () => {
      console.log('数据库打开成功');
      setIndb(request.result);
      // 遍历全部数据
      const cursor_request = request.result.transaction('user', 'readwrite').objectStore('user').openCursor();
      cursor_request.onsuccess = () => {
        const cursor = cursor_request.result;
        if (cursor) {
          // console.log(cursor.key)
          // console.log(cursor.value)
          const userValue = cursor.value; // 在safari中需要将参数值存到变量，再传给setState不然undefined
          setUser((prev) => {
            return [...prev, userValue];
          });
          cursor.continue();
        } else {
          setLoaded(true);
        }
      };
    };
    // 是否创建数据表
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('ui')) {
        db.createObjectStore('user', { keyPath: 'phone' });
        console.log('数据表已创建');
      }
    };
  }, []);

  // 获取每个用户的监听状态
  useEffect(() => {
    if (user.length > 0) {
      const monitorStatus: boolean[] = [];
      const tasks: any[] = [];
      for (let i = 0; i < user.length; i++) {
        tasks.push(axios.post(monitor_status_api, { phone: user[i].phone }));
      }
      // Promise.all 请求所有用户的 monitor 状态，全部完成后得到状态数组 res
      Promise.all(tasks).then((res) => {
        for (let i = 0; i < user.length; i++) {
          if (res[i]?.data.code === 200) monitorStatus[i] = true;
          else monitorStatus[i] = false;
        }
        // 对应更新每个用户的 monitor 状态
        setUser(prev => {
          return prev.map((user, index) => {
            return { ...user, monitor: monitorStatus[index] };
          });
        });
      });
    }
  }, [loaded]);

  const onCancel = () => {
    setOpen(false);
  };

  return (
    <div className={styles.startBox}>
      <h1>让我们开始吧</h1>
      <p className={styles.hint}>你可以选择或添加一个用户</p>
      {
        // 渲染所有用户卡片
        user.map((e) => {
          return (<UserCard
            indb={indb as IDBDatabase}
            key={e._uid}
            user={e}
            setUser={setUser}
            setCurrent={setCurrent}
            setAlert={setAlert}
            emitDialog={emitDialog}
          />);
        })
      }
      <ButtonBase
        sx={{
          maxWidth: 345,
          minWidth: 300,
          backgroundColor: '#ecf0f3',
          borderRadius: '13px',
          height: 165,
          marginBottom: 3.5,
          marginRight: 3.5
        }}
        className={styles.neumCard}
        onClick={() => { setOpen(true); }}
      >
        <Icon sx={{
          width: 'auto',
          height: 'auto'
        }}>
          <AddCircleOutlineOutlined fontSize='large' htmlColor='#6f788c' />
        </Icon>
      </ButtonBase>

      <Dialog open={open} onClose={onCancel}>
        {dialogChoice === DialogChoice.LOGIN ?
          <RenderLogin onOK={login} onCancel={onCancel} /> :
          <RenderConfig current={current as UserParamsType} onOK={storeConfig} onCancel={onCancel} />
        }
      </Dialog>
      <Snackbar
        open={alert.open}
        autoHideDuration={2000}
        onClose={() => { setAlert({ open: false, message: '' }); }}
      >
        <Alert onClose={() => { setAlert({ open: false, message: '' }); }} severity="error" sx={{ width: '100%' }}>
          {alert.message}
        </Alert>
      </Snackbar>
    </div >
  );
}

export default Start;