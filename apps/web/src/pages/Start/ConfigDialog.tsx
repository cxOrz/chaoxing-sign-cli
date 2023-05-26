import React, { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
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
import MenuItem from '@mui/material/MenuItem';
import ButtonBase from '@mui/material/ButtonBase';

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

const listTargetType = [
  {
    value: 'private',
    label: '私聊',
  },
  {
    value: 'group',
    label: '群组',
  },
];

export const RenderConfig: renderConfigType = (props) => {
  const [config, setConfig] = useState<UserConfig>({ ...defaultConfig });
  const [presetAddress, setPresetAddress] = useState<PresetAddress>([...defaultConfig.monitor.presetAddress]);

  useEffect(() => {
    if (props.current.config !== undefined) {
      setConfig(props.current.config);
      setPresetAddress(props.current.config.monitor.presetAddress);
    }
  }, [props.current]);

  // 写入配置
  const onOK = () => {
    props.onOK(props.current, {
      ...config,
      monitor: {
        ...config.monitor,
        presetAddress
      }
    });
  };

  const addPresetAddress = () => {
    setPresetAddress(prev => {
      prev.push({
        lon: '',
        lat: '',
        address: ''
      });
      return [...prev];
    });
  };

  const removePresetAddress = (i: number) => {
    setPresetAddress(prev => {
      prev.splice(i, 1);
      return [...prev];
    });
  };

  return (
    <>
      <DialogTitle>配置</DialogTitle>
      <DialogContent>
        <DialogContentText>
          配置监听模式下的签到信息：默认签到信息、邮箱信息、QQ机器人信息。
        </DialogContentText>
        <Box sx={{ my: 2 }} display="flex" flexDirection="column" >
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
          {
            presetAddress.map((preset, i) => {
              return (
                <Box
                  key={i}
                  display="flex"
                >
                  <Box flex={1}>
                    <Box display="flex" gap={1}>
                      <TextField
                        fullWidth
                        margin="dense"
                        variant="outlined"
                        label="经度"
                        type="text"
                        value={preset.lon}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                          setPresetAddress(prev => {
                            prev[i].lon = event.target.value;
                            return [...prev];
                          });
                        }}
                      />
                      <TextField
                        fullWidth
                        margin="dense"
                        variant="outlined"
                        label="纬度"
                        type="text"
                        value={preset.lat}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                          setPresetAddress(prev => {
                            prev[i].lat = event.target.value;
                            return [...prev];
                          });
                        }}
                      />
                    </Box>
                    <TextField
                      margin="dense"
                      label="详细地址"
                      type="text"
                      value={preset.address}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        setPresetAddress(prev => {
                          prev[i].address = event.target.value;
                          return [...prev];
                        });
                      }}
                      fullWidth
                      variant="outlined"
                    />
                  </Box>
                  {
                    i !== 0 &&
                    <ButtonBase
                      sx={{
                        color: '#d32f2f',
                        border: '1px solid #d32f2f70',
                        borderRadius: '4px',
                        m: '8px 0 4px 4px',
                        transition: 'all 200ms',
                        ':hover': {
                          background: '#d32f2f15',
                          borderColor: '#d32f2f'
                        }
                      }}
                      onClick={() => { removePresetAddress(i); }}
                    >
                      <DeleteIcon />
                    </ButtonBase>
                  }
                </Box>
              );
            })
          }
          <Button variant="text" onClick={addPresetAddress}><AddIcon /></Button>
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
            type="number"
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
            label="消息推送目标"
            select
            value={config.cqserver.target_type}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setConfig(prev => {
                return { ...prev, cqserver: { ...prev.cqserver, target_type: event.target.value } };
              });
            }}
            fullWidth
            variant="outlined">
            {listTargetType.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
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