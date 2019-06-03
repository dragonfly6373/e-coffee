const {app, protocol, shell, BrowserWindow} = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const sqlite3 = require("sqlite3").verbose();

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
            console.log("[LESS Debug]" + msg);
        },
        info: function(msg) {
            console.info("[LESS Info]" + msg);
        },
        warn: function(msg) {
            console.warn("[LESS Warn]" + msg);
        },
        error: function(msg) {
            console.error("[LESS Error]" + msg);
        }
    });
}
