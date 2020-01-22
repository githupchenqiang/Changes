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
    Platform

} from 'react-native';
import Global from "../Global";
var {width,height} =  Dimensions.get('window')
var isX =  (Platform.OS == 'ios' && height >= 812) ? 1:0;
export default class componentName extends Component {
    static navigationOptions = {
        title:"首页",
        headerStyle:{
            backgroundColor: '#f4511e',

        },
        headerTitleStyle: {
            fontWeight: 'bold',
        },

    };
    render() {
        return (
            <View>
                <View style={styles.ViewStyle}>
                <TouchableOpacity onPress = {()=>{

                }}>
                <Image source = {require('../icon/location.png')} style={styles.ImageStyle}/>
                </TouchableOpacity>
                <TextInput
                    placeholder = ' 联系人/会议/音频/视屏/对讲'
                    placeholderTextColor = '#CDCDCD'
                    backgroundColor = "white"
                    // onChange = {(text)={

                    // }}
                    style = {styles.TextStyle}
                />
                <TouchableOpacity onPress = {()=>{

                }}>
                <Image source={require('../icon/plus.png')} style = {styles.MoreStyle}/>
                </TouchableOpacity>

            </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({

    ViewStyle:{flexDirection:'row',
    alignItems:'center',
    width:width,
    height:isX ? 88 : 64,
    backgroundColor:'#f1f1f1',
    justifyContent:'space-between'
    },

    ImageStyle:{
        marginTop:30,
        marginLeft:15,
        width:25,
        height:25,
    },
    TextStyle:{
        height:35,
        width:width-110,
        marginLeft:55,
        position:'absolute',
        bottom:10,
    },
    MoreStyle:{
        marginTop:3,
        width:25,
        height:25,
        position:'absolute',
        right:15,
    },
    bannerStyle:{
       width:width,
       height:150,
    }
})
