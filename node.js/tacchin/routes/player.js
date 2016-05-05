var express = require('express');
var router  = express.Router();
var spawn   = require('child_process').spawn;
var async   = require('async');
var storage = require('../storage');

var app    = require('../app');

var config = require('../config.json');

router.get('/', function(req, res, next) {
  res.render('player', {device: 'pt3video3', channel: req.params.channel, sid: req.params.sid, connect_sid: req.sessionID});
});

router.get('/GR/:channel(\\d+)/:sid(\\d+)', function(req, res, next) {
  var device  = config.gr_tuner;
  var channel = req.params.channel;
  var sid     = req.params.sid;
  stream_play(device, channel, sid, req.sessionID);
  res.render('player', {device: device, channel: channel, sid: sid, server_ip: config.server_ip, connect_sid: req.sessionID, channel_name: req.channel_name, title: req.title});
});

router.post('/GR/:channel(\\d+)/:sid(\\d+)', function(req, res, next) {
  var device  = config.gr_tuner;
  var channel = req.params.channel;
  var sid     = req.params.sid;
  stream_play(device, channel, sid, req.sessionID);
  res.render('player', {device: device, channel: channel, sid: sid, server_ip: config.server_ip, connect_sid: req.sessionID, channel_name: req.channel_name, title: req.title});
});

router.post('/BS/:channel([a-z][A-Z]\\d+_\\d+)/:sid(\\d+)', function(req, res, next) {
  var device  = config.bs_tuner;
  var channel = req.params.channel;
  var sid     = req.params.sid;
  stream_play(device, channel, sid, req.sessionID);

  console.log("BSのPOSTリクエスト来たンゴ: [" + req.body.name + "]");

  res.render('player', {device: device, channel: channel, sid: sid, server_ip: config.server_ip, connect_sid: req.sessionID, channel_name: req.channel_name, title: req.title});
});

router.get('/BS/:channel([a-z][A-Z]\\d+_\\d+)/:sid(\\d+)', function(req, res, next) {
  var device  = config.bs_tuner;
  var channel = req.params.channel;
  var sid     = req.params.sid;
  stream_play(device, channel, sid, req.sessionID);

  console.log("BSのGETリクエスト来たンゴ: [" + req.channel_name + "]");

  res.render('player', {device: device, channel: channel, sid: sid, server_ip: config.server_ip, connect_sid: req.sessionID, channel_name: req.channel_name, title: req.title});
});

router.get('/CS/:channel([a-z][A-Z]\\d+)/:sid(\\d+)', function(req, res, next) {
  var device  = config.bs_tuner;
  var channel = req.params.channel;
  var sid     = req.params.sid;
  stream_play(device, channel, sid, req.sessionID);
  console.log("CSのGETリクエスト来たンゴ: [" + req.channel_name + "]");
  res.render('player', {device: device, channel: channel, sid: sid, server_ip: config.server_ip, connect_sid: req.sessionID, channel_name: req.channel_name, title: req.title});
});

router.post('/CS/:channel([a-z][A-Z]\\d+)/:sid(\\d+)', function(req, res, next) {
  var device  = config.bs_tuner;
  var channel = req.params.channel;
  var sid     = req.params.sid;
  stream_play(device, channel, sid, req.sessionID);
  console.log("CSのPOSTリクエスト来たンゴ: [" + req.channel_name + "]");
  res.render('player', {device: device, channel: channel, sid: sid, server_ip: config.server_ip, connect_sid: req.sessionID, channel_name: req.channel_name, title: req.title});
});

module.exports = router;

function channel_change(device, channel, sid, sessionID)
{
	var device_channel    = device + '-' + 'channel';
	var device_sid        = device + '-' + 'sid';

	// 録画プロセス殺しーの、録画プロセス作りーのでチャンネル変更を行うンゴ
	var exec  = require('child_process').exec;
	var child = exec('fuser -s -k /dev/' + device + ' >/dev/null');

	var child = spawn('./test.sh', [device, channel, sid],
	    { stdio:'pipe' });

	storage.setItem(device_channel,    channel);
	storage.setItem(device_sid,        sid);
}

function stream_play(device, channel, sid, sessionID)
{
	var date  = new Date();
        var valid = sessionID + '-valid';
	var sids  = new Array();
	var do_session_manager = true;
	storage.setItem(valid, date.getTime()+5000);

	var session_device    = sessionID + '-' + device;
	var device_channel    = device    + '-' + 'channel';
	var device_master     = device    + '-' + 'master';
	var device_sid        = device    + '-' + 'sid';
	var device_sessionIDs = device    + '-' + 'sessionIDs';

	if (! process_check(device)) {
		// 録画プロセス動作中
		if (sessionID  == storage.getItem(device_master) &&
		    (sid       != storage.getItem(device_sid) ||
		     channel   != storage.getItem(device_channel))
		) {
			console.log("チャンネル変更ンゴ: [" + sessionID + "]");
			channel_change(device, channel, sid, sessionID)
			do_session_manager = false;
		} else if (sessionID != storage.getItem(device_master)) {
			console.log("sessionID:[" + sessionID + "] device_master:[" + storage.getItem(device_master) + "]");
			sids = storage.getItem(device_sessionIDs);
			sids.push(sessionID);
			storage.setItem(device_sessionIDs, sids);
			console.log("SID追加ンゴ: [" + sessionID + "]");
		} else {
			console.log("チャンネル変更しないパターンンゴ");
			do_session_manager = false;
		}
	} else {
		// 録画プロセス非動作
		var child = spawn('./test.sh', [device, channel, sid],
		    { stdio:'pipe' });

		sids[0]  = sessionID;

		storage.setItem(session_device,    device);
		storage.setItem(device_channel,    channel);
		storage.setItem(device_master,     sessionID);
		storage.setItem(device_sid,        sid);
		storage.setItem(device_sessionIDs, sids);

		child.on('close', function(code) {
		    console.log('Child process closed');
		});
		child.on('disconnect', function(code) {
		    // disconnect 受付時の処理は不要
		    console.log('Child process disconnected');
		});
		child.on('exit', function(code) {
		    // 終了時の処理は特に必要ないのではないか
		    // やるとしても SESSION のCLOSEぐらい？
		    // →SESSION CLOSE時にブラウザへ影響が出ると、チャンネル変更時にぶら下がってる画面で何かが起きる予感なので、よろしくない。
		    console.log('Child exited with code ' + code);
		});
	}
	if (do_session_manager) {
		session_manager(sessionID, device);
	}
}

function process_check(device)
{
	var spawnSync = require('child_process').spawnSync;
	var ret = true;
        var child = spawnSync('fuser', ['/dev/' + device]);
	if (child.status == 0) {
		ret = false;
	}
	return ret;
}

function stream_stop(device, sessionID)
{
	var do_kill           = true;
	var session_device    = sessionID + '-' + device;
	var device_channel    = device    + '-' + 'channel';
	var device_master     = device    + '-' + 'master';
	var device_sid        = device    + '-' + 'sid';
	var device_sessionIDs = device    + '-' + 'sessionIDs';

	var SIDs = storage.getItem(device_sessionIDs);
	if (SIDs.length > 1) {
		// 子あり
		if (storage.getItem(device_master) == sessionID) {
			var new_sid = SIDs[1];
			storage.setItem(device_master, new_sid);
		}
		var index = SIDs.indexOf(sessionID);
		if (index < 0) {
			// 内部エラー
			console.log('内部エラーンゴ。sid がないンゴ sid:' + sessionID);
			return;
		}
		SIDs.splice(index, 1);
		storage.setItem(device_sessionIDs, SIDs);
		do_kill = false;
	} else {
		// 子無し
		storage.removeItem(session_device);
		storage.removeItem(device_channel);
		storage.removeItem(device_master);
		storage.removeItem(device_sid);
		storage.removeItem(device_sessionIDs);
	}

	if (do_kill) {
		console.log('recpt1 と ffmpeg 殺すンゴ:' + sessionID);
        	var exec  = require('child_process').exec;
        	var child = exec('fuser -s -k /dev/' + device + ' >/dev/null');
	}
}

function session_manager(sessionID, device)
{
    var valid = sessionID + '-valid';
    var date  = new Date();
    async.forever(function(callback) {
        async.series([
            function(callback) {
                setTimeout(callback, 1000);
            },
            function(callback) {
                date = new Date();
                if (storage.getItem(valid) > date.getTime()) {
                    callback();
                } else {
                    console.log("タイムアウトしたンゴ now[" + date.getTime() + "] timeout[" + storage.getItem(valid) + "]" );
                    stream_stop(device, sessionID);
                    storage.removeItem(valid);
                }
            },
        ], callback);
    }, function(err) {
        console.log(err);
    });
}
