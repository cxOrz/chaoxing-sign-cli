import React, { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import { defaultConfig } from './Start';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';

type renderLoginType = React.FC<{
  onOK: (phone: string, password: string) => Promise<any>;
  onCancel: () => void;
}>;

type renderConfigType = React.FC<{
  current: UserParamsType;
  onOK: (target: UserParamsType, config: UserConfig) => void;
  onCancel: () => void;
}>;

export const RenderLogin: renderLoginType = (props) => {
  const [loginform, setLoginForm] = useState({ phone: '', pwd: '' });
  const [okDisabled, setOkDisabled] = useState(false);

  const onOK = async () => {
    setOkDisabled(true);
    await props.onOK(loginform.phone, loginform.pwd);
    setOkDisabled(false);
  };

  return (
    <>
      <DialogTitle>添加用户</DialogTitle>
      <DialogContent>
        <DialogContentText>
          添加你的学习通账号，完成后可选择账号登录，进行签到。
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="phone"
          label="手机号码"
          value={loginform.phone}
          type="tel"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setLoginForm(prev => {
              return { ...prev, phone: event.target.value };
            });
          }}
          fullWidth
          variant="standard"
        />
        <TextField
          margin="dense"
          id="pwd"
          label="密码"
          type="password"
          value={loginform.pwd}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setLoginForm(prev => {
              return { ...prev, pwd: event.target.value };
            });
          }}
          fullWidth
          variant="standard"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onCancel}>取消</Button>
        <Button onClick={onOK} disabled={okDisabled}>确认</Button>
      </DialogActions>
    </>
  );
};

export const RenderConfig: renderConfigType = (props) => {
  const [config, setConfig] = useState<UserConfig>(defaultConfig);

  useEffect(() => {
    if (props.current.config !== undefined) {
      setConfig(props.current.config);
    }
  }, [props.current]);

  // 写入配置
  const onOK = () => {
    props.onOK(props.current, config);
  };

  return (
    <>
      <DialogTitle>配置</DialogTitle>
      <DialogContent>
        <DialogContentText>
          配置监听模式下的签到信息：默认签到信息、邮箱信息、QQ机器人信息。
        </DialogContentText>
        <Box sx={{ my: 2 }}>
          <Divider><Chip label="签到信息" /></Divider>
          <TextField
            margin="dense"
            id="delay"
            label="签到延时(秒)"
            value={config.monitor.delay}
            type="number"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setConfig(prev => {
                return { ...prev, monitor: { ...prev.monitor, delay: Number(event.target.value) } };
              });
            }}
            fullWidth
            variant="outlined"
          />
          <TextField
            margin="dense"
            id="lon"
            label="经度"
            type="text"
            value={config.monitor.lon}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setConfig(prev => {
                return { ...prev, monitor: { ...prev.monitor, lon: event.target.value } };
              });
            }}
            fullWidth
            variant="outlined"
          />
          <TextField
            margin="dense"
            id="lat"
            label="纬度"
            type="text"
            value={config.monitor.lat}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setConfig(prev => {
                return { ...prev, monitor: { ...prev.monitor, lat: event.target.value } };
              });
            }}
            fullWidth
            variant="outlined"
          />
          <TextField
            margin="dense"
            id="address"
            label="详细地址"
            type="text"
            value={config.monitor.address}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setConfig(prev => {
                return { ...prev, monitor: { ...prev.monitor, address: event.target.value } };
              });
            }}
            fullWidth
            variant="outlined"
          />
        </Box>
        <Box sx={{ my: 2 }}>
          <Divider><Chip label="邮件" /></Divider>
          <FormGroup sx={{ flexDirection: 'row' }}>
            <FormControlLabel
              label="启用邮件功能"
              control={
                <Switch checked={config.mailing.enabled}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setConfig(prev => {
                      return { ...prev, mailing: { ...prev.mailing, enabled: event.target.checked } };
                    });
                  }}
                />
              }
            />
            <FormControlLabel
              label="启用 SSL 协议"
              control={
                <Switch checked={config.mailing.ssl}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setConfig(prev => {
                      return { ...prev, mailing: { ...prev.mailing, ssl: event.target.checked } };
                    });
                  }}
                />
              }
            />
          </FormGroup>
          <TextField
            margin="dense"
            id="host"
            label="主机"
            type="text"
            value={config.mailing.host}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setConfig(prev => {
                return { ...prev, mailing: { ...prev.mailing, host: event.target.value } };
              });
            }}
            fullWidth
            variant="outlined"
          />
          <TextField
            margin="dense"
            id="port"
            label="端口"
            type="text"
            value={config.mailing.port}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setConfig(prev => {
                return { ...prev, mailing: { ...prev.mailing, port: Number(event.target.value) } };
              });
            }}
            fullWidth
            variant="outlined"
          />
          <TextField
            margin="dense"
            id="user"
            label="发送者"
            type="email"
            value={config.mailing.user}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setConfig(prev => {
                return { ...prev, mailing: { ...prev.mailing, user: event.target.value } };
              });
            }}
            fullWidth
            variant="outlined"
          />
          <TextField
            margin="dense"
            id="pass"
            label="密钥"
            type="text"
            value={config.mailing.pass}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setConfig(prev => {
                return { ...prev, mailing: { ...prev.mailing, pass: event.target.value } };
              });
            }}
            fullWidth
            variant="outlined"
          />
          <TextField
            margin="dense"
            id="to"
            label="接收者"
            type="email"
            value={config.mailing.to}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setConfig(prev => {
                return { ...prev, mailing: { ...prev.mailing, to: event.target.value } };
              });
            }}
            fullWidth
            variant="outlined"
          />
        </Box>
        <Box sx={{ my: 2 }}>
          <Divider><Chip label="cq-http" /></Divider>
          <FormGroup sx={{ alignSelf: 'start' }}>
            <FormControlLabel
              label="启用 cq-http 连接"
              control={
                <Switch checked={config.cqserver.cq_enabled}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setConfig(prev => {
                      return { ...prev, cqserver: { ...prev.cqserver, cq_enabled: event.target.checked } };
                    });
                  }}
                />
              }
            />
          </FormGroup>
          <TextField
            margin="dense"
            id="ws_url"
            label="Websocket地址"
            type="url"
            value={config.cqserver.ws_url}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setConfig(prev => {
                return { ...prev, cqserver: { ...prev.cqserver, ws_url: event.target.value } };
              });
            }}
            fullWidth
            variant="outlined"
          />
          <TextField
            margin="dense"
            id="target_type"
            label="私聊或群组(private或group)"
            type="text"
            value={config.cqserver.target_type}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setConfig(prev => {
                return { ...prev, cqserver: { ...prev.cqserver, target_type: event.target.value } };
              });
            }}
            fullWidth
            variant="outlined"
          />
          <TextField
            margin="dense"
            id="target_id"
            label="目标号码(QQ号或群号)"
            type="number"
            value={config.cqserver.target_id}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setConfig(prev => {
                return { ...prev, cqserver: { ...prev.cqserver, target_id: Number(event.target.value) } };
              });
            }}
            fullWidth
            variant="outlined"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onCancel}>取消</Button>
        <Button onClick={onOK}>确认</Button>
      </DialogActions>
    </>
  );
};