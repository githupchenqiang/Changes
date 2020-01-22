import React, { Component } from 'react'
import {
    View,
    Text,
    Image,
    Alert,
    StyleSheet,
    Dimensions,
    ScrollView,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    FlatList,
    Platform,
    DeviceEventEmitter
} from 'react-native';
import {RTCView} from 'react-native-webrtc';
var {width,height} =  Dimensions.get('window')
import { jsxAttribute } from '@babel/types';
import { Button } from 'react-native-elements';
import config from '../../config';
import Janus from '../janus.mobile';
import InCallManager from 'react-native-incall-manager';
import Singleton from '../USerControl/Singleton'
import Global from "../Global";
var TimerMixin = require('react-timer-mixin');
var IsIOS = Platform.OS === 'ios'? 1 :0
var isIphoneX = ((IsIOS) && (height >= 812)) ? 1 : 0
var navigationBarHeight = isIphoneX ? 88 : 64
var stateBar = isIphoneX ? 44 : 20
var ViewPositionTop =  stateBar + 10
var bottomHeight = isIphoneX ? 34 : 20
let janus;
var ToUsername
let sipCall = null;
var audioEnable = true
var videoEnable = true
var ISAudioSession = true

var acceptJsp = null
var commingjsp = null;
export default class componentName extends Component {
    constructor(props){
        super(props)
        this.state = {
            count:0,
            timeText:'',
            miuter:0,
            TimeTxt:'正在连接...',
            selfViewSrc:null,
            selfViewSrcKey: null,
            publish: false,
            info: 'Initializing',
            status: 'init',
            remoteList: {},
            remoteListPluginHandle: {},
            mainViewSrc:null,
            text: '',
            roomList:[],
            chatList:[],
            audioMute: false,
            videoMute: false,
            speaker: false,
            remoteMute:false,
            currentId:'',
            messages: [],
            ToName:'',
            selfStream:null,
            remoteStram:null,
            Audioimage:require('../icon/close_mic2.png'),
            isClosed:false,
        }
    }
    componentDidMount() {

        let {user_name,Calljsep} =  this.props.navigation.state.params;
        ToUsername =  user_name
        commingjsp = Calljsep;
        this._StartAudioJanus();
        if (Global.isIncomming) {
            this._StartTimer();
            var offertype = false
            var doAudio = true, doVideo = false;
            if (commingjsp !== null && commingjsp !== undefined) {
                doAudio = (commingjsp.sdp.indexOf("m=audio ") > -1);
				doVideo = (commingjsp.sdp.indexOf("m=video ") > -1);
            }else{
                doVideo = false;
                offertype = true;
            }
            var Calltype = (offertype ? sipCall.createOffer : sipCall.createAnswer)

            Calltype({
                jsep: commingjsp,
                media: { audio: doAudio, video: doVideo},
               success:function(jsep){
                var body = {request: "accept"};
                acceptJsp = jsep
                sipCall.send({"message": body, "jsep": jsep});
               }
            })
        }
        this.deEmitter = DeviceEventEmitter.addListener('onmessage', (msg, jsep) => {
         let result = msg["result"];
         if (result !== null && result !== undefined) {
             let event = result["event"];
             if (event !== undefined && event !== null) {
                 if(event === "calling"){
                 }else if(event === "accepted"){
                    this._StartTimer();
                    if (!Global.isIncomming) {
                        sipCall.handleRemoteJsep({jsep: jsep, error: doHangup});
                    }else{
                        sipCall.handleRemoteJsep({jsep: acceptJsp, error: doHangup});
                    }
                 }else if(event === 'hangup') {
                    this._hungUPAction();
                 }else if(event === 'updatingcall') {
                    var doAudio = (jsep.sdp.indexOf("m=audio ") > -1),
                    doVideo = (jsep.sdp.indexOf("m=video ") > -1);
                    sipCall.createAnswer(
                        {
                            jsep: commingjsp,
                            media: { audio: doAudio, video: doVideo },
                            success: function(jsep) {
                                var body = { request: "update" };
                                sipCall.send({"message": body, "jsep": jsep});
                            },
                            error: function(error) {
                                Janus.error("WebRTC error:", error);
                            }
                        });

                 }else if(event === 'progress'){
                    if(jsep !== null && jsep !== undefined) {
                        sipcall.handleRemoteJsep({jsep:commingjsp , error: doHangup });
                    }
                 }
             }
         }
     });
     this.deEmitter = DeviceEventEmitter.addListener('onlocalstream', (stream) => {
         this.setState({
             selfStream:stream.toURL(),
         })
     })
     this.deEmitter = DeviceEventEmitter.addListener('onremotestream', (stream) => {
         this.setState({
             remoteStram:stream.toURL(),
         })
     })

       }

       _StartTimer=()=>{
        this.timer = setInterval(
            () => {
              this._timeShow();
            },
            1000,
          );
       }
       //声明一个定时器
       _timeShow =()=>{
         this.state.count = this.state.count + 1
         if (this.state.count==60){
             this.state.miuter = this.state.miuter+1
             this.state.count = 0
         }
         if (this.state.count >= 10){
             if (this.state.miuter >= 10){
                 this.state.timeText =  this.state.miuter + ':' + this.state.count
             }else{
                 this.state.timeText =  '0' + this.state.miuter + ':'  + this.state.count
             }
         }else{
             if (this.state.miuter >= 10){
                 this.state.timeText =  this.state.miuter + ':' + '0' + this.state.count
             }else{
                 this.state.timeText =  '0'+ this.state.miuter + ':' + '0' + this.state.count
             }
         }
           this.setState({
             TimeTxt:this.state.timeText
           })
       }

       componentWillUnmount() {
         // 如果存在this.timer，则使用clearTimeout清空。
         // 如果你使用多个timer，那么用多个变量，或者用个数组来保存引用，然后逐个clear
         this.timer && clearInterval(this.timer);
         // count = 0;
         // miuter = 0;
         Global.isIncomming = false
        sipCall = null;
        }

       _StartAudioJanus =()=>{
        let single = new Singleton
        sipCall = single.getSipcall()

        if (!Global.isIncomming) {
            sipCall.createOffer(
                {
                    media: {
                        audioSend: true, audioRecv: true,		// We DO want audio
                        videoSend: true, videoRecv: true	// We MAY want video
                    },
                    success: function(jsep) {
                        var body = { request: "call", uri:ToUsername};
                        sipCall.send({"message": body, "jsep": jsep});
                    },
                    error: function(error) {
                        console.log("WebRTC error... " + JSON.stringify(error));
                    }
                });
        }
     }
     _audioSet=()=>{
         audioEnable = !audioEnable
         if(audioEnable){
             this.setState({
                 Audioimage:require('../icon/close_mic2.png')
             })
             sipCall.muteAudio()
         }else{
             this.setState({
                 Audioimage:require('../icon/close_mic.png')

             })
             sipCall.unmuteAudio()
         }
         // this.SetSystemAudio();

     }

     _hungUPAction= ()=>{
        sipCall.send({"message":{"request": "hangup"}});
        sipCall.hangup()
        if (!this.state.isClosed) {
            this.setState({isClosed:true})
            this.props.navigation.pop()
        }

     }
     render() {
         return (
           <View style={{flex:1,alignItems:'center'}}>
             <View style={styles.TopStyle}>
                 <TouchableOpacity
                     onPress={()=>{
                        if (!this.state.isClosed) {
                            this.setState({isClosed:true})
                            this.props.navigation.pop()
                        }
                         }}
                     >
                 <View >

                     {/* <Image  source={require('../icon/取消.png')} style={styles.backIcon}/> */}

                 </View>
                 </TouchableOpacity>

                 <View>

                 </View>
             </View>
                 <Text style={styles.TitleStyle}>音频通话</Text>
                 <Text style = {{color: 'red',fontSize:16,marginTop:10}}>{ToUsername}</Text>
                 <Text style = {{fontSize:13,justifyContent:'center',marginTop:10}}>{this.state.TimeTxt}</Text>

                 {/* <RTCView streamURL={this.state.remoteStram} style={styles.RemoteRTCStyle}/>
                <RTCView streamURL={this.state.selfStream} style={styles.localRTCStyle}/> */}
             <View style = {styles.BottomView}>
                 <TouchableOpacity
                     onPress = {()=>{
                         this._audioSet()
                     }}
                 >
                 <View style={{justifyContent:'center'}}>
                     <Image  source={this.state.Audioimage} style={styles.BottomIcon}/>
                     <Text style={styles.TextStyle}>静音</Text>
                 </View>
                 </TouchableOpacity>
                 <TouchableOpacity
                     onPress = {()=>{
                       this._hungUPAction();
                     }}
                 >
                 <View>
                     <Image source={require('../icon/hangup_call.png')} style={styles.BottomIcon}/>
                     <Text style={styles.TextStyle}>挂断</Text>
                 </View>
                 </TouchableOpacity>
                 <TouchableOpacity
                  onPress = {()=>{

                 }}>
                 <View>
                     {/* <Image source={require('../icon/视频2.png')}style={styles.BottomIcon}/>
                     <Text style={styles.TextStyle}>音频通话</Text> */}
                 </View>
                 </TouchableOpacity>
             </View>
           </View>
         )
     }
 }

 const styles = StyleSheet.create({
     TopStyle:{
         marginTop:ViewPositionTop,
         flexDirection:'row',
         width:width,
         height:50,
         alignItems:'center',

         // justifyContent:'space-between',
     },
     BackStyle:{
         backgroundColor:'#CDCDCD',
         width:60,
         height:35,
         marginLeft:10,
         alignItems:'center',
         justifyContent:'center',
         borderRadius:6,
     },
     backIcon:{
         width:25,
         height:25,
     },
     TitleStyle:{
         fontSize:17,
         color:'black',
         textAlign:'center',
         justifyContent:'center',
         ...Platform.select({
             ios:{
                 lineHeight:50,
         }})
     },
     Reloation:{
         width:40,
         height:40,
         marginRight:10,
     },
     BottomView:{
         width:width,
         height:70,
         flexDirection:'row',
         justifyContent:'space-between',
         position:'absolute',
         bottom:bottomHeight

     },
     BottomIcon:{
         // marginLeft:40,
         // marginRight:40,
         width:45,
         height:45,
     },
     TextStyle:{
         textAlign:'center',
         marginTop:10,

     },
     RemoteRTCStyle:{
         width:width,
         height:200,
         backgroundColor:'black',
     },
     localRTCStyle:{
         width:width,
         height:200,
         backgroundColor:'red',
     }

 })


 function doHangup() {
    // Hangup a call
    if (!this.state.isClosed) {
        this.setState({isClosed:true})
        this.props.navigation.pop()
    }
	var hangup = { "request": "hangup" };
	sipCall.send({"message": hangup});
    sipCall.hangup();

}
