const {app, protocol, shell, BrowserWindow} = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

let less = require("less");
let mainWindow = null;
let currentScript = {};

function createWindow() {
    mainWindow = new BrowserWindow({
        title: "e-coffee",
        icon: "images/app_icon.png",
        autoHideMenuBar: true
    });
    var context = window;
    less.logger.addListener({
        debug: function(msg) {
            console.log("[LESS]" + msg);
        },
        info: function(msg) {
            console.info("[LESS]" + msg);
        },
        warn: function(msg) {
            console.warn("[LESS]" + msg);
        },
        error: function(msg) {
            console.error("[LESS]" + msg);
        }
    });
}
