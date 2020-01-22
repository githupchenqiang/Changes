import React from 'react'
import Janus from "../janus.mobile";
import Global from "../Global";
import {DeviceEventEmitter} from 'react-native';

let instance = null;
let janus = null;
let videocall = null;
let sipcall = null;
let opaqueId = null;

export default class Singleton {

    constructor() {
        if (!instance) {
            instance = this;
        }
        return instance;
    }

    initJanus(username, password, ip, gateway, iceserver) {
        janus = new Janus({
            server: `http://${gateway}/janus`,
            iceServers: [{urls: iceserver}],
            success: () => {
                janus.attach({
                    plugin: "janus.plugin.videocall",
                    success: (pluginHandle) => {
                        videocall = pluginHandle;
                        let register = {"request": "register", "username": username};
                        videocall.send({"message": register});
                    },
                    error: (error) => {

                        Global.isSip = false;
                        DeviceEventEmitter.emit('login', error);
                    },
                    consentDialog: (on) => {
                        DeviceEventEmitter.emit('consentDialog', on);
                    },
                    mediaState: (medium, on) => {
                        DeviceEventEmitter.emit('mediaState', medium, on);
                    },
                    webrtcState: (on) => {
                        DeviceEventEmitter.emit('webrtcState', on);
                    },
                    onmessage: (msg, jsep) => {
                        console.log(msg)
                        let result = msg["result"];
                        if (result !== null && result !== undefined) {
                            let event = result["event"];
                            if (event !== undefined && event !== null) {
                                if (event === 'registered') {
                                    this.initSip(username, password, ip, gateway);
                                }
                            } else {
                                DeviceEventEmitter.emit('login', "GW登录失败1");
                            }
                        } else {
                            let error = msg["error"];
                            Global.isConnected = false;
                            DeviceEventEmitter.emit('login', "videocall:" + error);
                        }
                        DeviceEventEmitter.emit('onmessage', msg, jsep);
                    }
                    ,
                    onlocalstream: (stream) => {
                        DeviceEventEmitter.emit('onlocalstream', stream);
                    },
                    onremotestream: (stream) => {
                        DeviceEventEmitter.emit('onremotestream', stream);
                    },
                    oncleanup: () => {
                        DeviceEventEmitter.emit('oncleanup');
                    }
                });
            },
            error: (error) => {
                console.info("网络断开了")
                Global.isConnected = false;
                DeviceEventEmitter.emit('login', "janus:" + error);
            },
            destroyed: () => {
                DeviceEventEmitter.emit('destroyed');
            }
        })
    }


    initSip(username, password, ip, gateway) {
        janus.attach(
            {
                plugin: "janus.plugin.sip",
                opaqueId: opaqueId,
                success: function (pluginHandle) {
                    sipcall = pluginHandle;
                    console.log("拿到handle");
                    let register = {

                        request: "register",
                        username: "sip:" + username + "@" + ip,
                        authuser: username,
                        display_name: username,
                        secret: password,
                        proxy: "sip:" + ip + ":5060",
                        sips: false,

                    };
                    sipcall.send({"message": register});
                    DeviceEventEmitter.emit('success', pluginHandle);
                },
                error: function (error) {
                    DeviceEventEmitter.emit('login', error);
                },
                consentDialog: function (on) {
                    DeviceEventEmitter.emit('consentDialog', on);
                },
                mediaState: function (medium, on) {
                    DeviceEventEmitter.emit('mediaState', medium, on);
                },
                webrtcState: function (on) {
                    DeviceEventEmitter.emit('webrtcState', on);
                },
                onmessage: function (msg, jsep) {
                    console.log(msg);
                    // Any error?
                    let error = msg["error"];
                    if (error != null && error != undefined) {
                        DeviceEventEmitter.emit('login', error);
                        return;
                    }
                    let result = msg["result"];
                    if (result !== null && result !== undefined && result["event"] !== undefined && result["event"] !== null) {
                        let event = result["event"];
                        if (event === 'registered') {
                            Global.isConnected = true;
                            console.info("注册成功")
                            DeviceEventEmitter.emit('login', "success");
                        } else if (event === 'registration_failed') {
                            DeviceEventEmitter.emit('login', "SIP登录失败1");
                        } else if (event === 'hangup') {
                            let error = result["code"];
                            if (error === 404) {
                                let reason = result["reason"];
                                DeviceEventEmitter.emit('login', "sip:" + reason);
                            }
                        }
                    }
                    DeviceEventEmitter.emit('onmessage', msg, jsep);
                },
                onlocalstream: function (stream) {
                    DeviceEventEmitter.emit('onlocalstream', stream);
                },
                onremotestream: function (stream) {
                    DeviceEventEmitter.emit('onremotestream', stream);
                },
                oncleanup: function () {
                    DeviceEventEmitter.emit('oncleanup');
                },
            });
    }

    getJanus() {
        return janus;
    };

    getVideoCall() {
        return videocall;
    }

    getSipcall() {
        return sipcall;
    }
}
