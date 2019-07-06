const {LANG} = require('./config');
const MSGS = require('../messages')[LANG];


const isEmail = (email)=>{
    const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (email.match(regex)){
        return true;
    }
    else{
        return false;
    }
};


const isEmpty = (string)=>{
    if (string.trim() === '') return true;
    else return false;
};

exports.validateSignupData = (data)=>{
    let errors = {};
    if (isEmpty(data.email)){
        errors.email = MSGS.user.email_empty;
    }
    else if (!isEmail(data.email)){
        errors.email = MSGS.user.email_not_valid;
    }
    if (isEmpty(data.password)){
        errors.password = MSGS.user.empty_field;
    }
    if(data.password !== data.confirmPassword){
        errors.confirmPassword = MSGS.user.password_not_match;
    }
    console.log(JSON.stringify(errors));
    return {
      errors,
      valid: Object.keys(errors).length > 0 ? false: true
    };
};

exports.validateLoginData = (user)=>{
    let errors = {};
    if (isEmpty(user.email)) {
        errors.email = MSGS.user.empty_field;
    }
    if (isEmpty(user.password)) {
        errors.password = MSGS.user.empty_field;
    }
    return {
        errors,
        valid: Object.keys(errors).length > 0 ? false: true
    };
};

exports.isEmpty = isEmpty;