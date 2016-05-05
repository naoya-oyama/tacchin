# tacchin(TVリアルタイム視聴テストプログラム)
TVをリアルタイム視聴するための実験ソフトウェアです。
B25をデコードするソフトウェアやチューナを操作するソフトウェアは配布に含まれません。
動画をデコード・エンコードするソフトウェアは配布に含まれません。

## これはなに？

TVのストリームをブラウザ上にリアルタイムに表示するための実験実装です。

## 必須(ソフトウェア)

* Linux(QSV対応カーネルがインストールされたもの)
* Intel Media Server Studio(Community edition) 2016
* Node.js
* ffmpeg(3.0.0以降)
* nginx
* recpt1互換ソフトウェア

## 必須(ハードウェア)

* CPU: インストールするIntel Media Server Studio のQSVサポートするもの
* RAM: 2GByte
* TVチューナ: recpt1互換ソフトウェアから操作可能なもの


# 推奨環境(ハードウェア)

* CPU: Intel Core i3 4360
* RAM: 8GB
* DISK: 64GB位(作業ファイルはあまり作りません)
* TVチューナ: PT3

# 推奨環境(ソフトウェア)

* CentOS 7.1 64bit
* Intel Media Server Studio(Community edition) 2016
* ffmpeg 3.0.0
* node.js v4.1.1

# 想定視聴環境

PC又はスマートフォンのウェブブラウザ(Firefox Developer Edition, chrome, edge)

## 利用しているモジュール

詳細なバージョンは`package.json`参照

* express 4.12.*
* express-session 1.11.*
* jade
* socket.io
* dash.js

## インストール作業の流れ

1. 使用予定のCPUが Intel Media Server Studio でQSVサポートとなっているか要確認
  * Intel Ark で CPU 側がサポートとなっていても、Media Server Studio 側がサポート外である場合もあるので注意
  * 2016ではivy以前の世代、Atom系、Celeron、Pantiumはサポート外
  * skylake は現状(2016/5)の Media Server Studio でサポート外
1. ハードウェア環境の構築
1. OSインストール
1. Intel Media Server Studio をインストール
1. チューナデバイスのドライバをインストール
1. recpt1互換ソフトウェアのインストール
1. epgdump(.json出力が出来るもの)をインストール
 *  https://github.com/Piro77/epgdump
1. mfx_dispatch をソースから取得してきて、ビルドしてインストール
1. ffmpeg をソースから取得してきて、ビルドしてインストール
1. nginx をインストール
 * 以下サンプルを参考に`nginx.conf`を設定する(ACLは適切に投入すること)
 * nginx を tacchin アカウントで動作させたい場合、tacchin アカウントを作成すること
1. node.js をインストール
1. tacchin をインストール
```
user tacchin tacchin;
    server {
        listen       80 default_server;
        listen       [::]:80 default_server;
        root         /PATH/TO/tacchin;

        location /data {
            add_header Cache-Control no-cache;
            add_header Access-Control-Allow-Origin *;
        }

        location /socket.io/ {
            add_header Access-Control-Allow-Origin *;
            proxy_pass http://127.0.0.1:8078/socket.io/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        location /websocket {
            proxy_pass         http://127.0.0.1:8087/;
            proxy_http_version 1.1;
            proxy_set_header   Upgrade $http_upgrade;
            proxy_set_header   Connection "upgrade";
        }

        location /tacchin/ {
            proxy_pass         http://127.0.0.1:8078/;
            proxy_http_version 1.1;
            proxy_set_header   Upgrade $http_upgrade;
            proxy_set_header   Connection "upgrade";
        }
    }
```

## tacchin のインストール
```
git pull git@github.com:naoya-oyama/tacchin.git
crontab -e
02 0  *  *  * (cd /PATH/TO/tacchin/script; ./create_xml.sh ) > /dev/null 2>&1 >/dev/null
edit /PATH/TO/tacchin/node.js/tacchin/config.json
```
* tacchin 動作アカウントの crontab に ~/tacchin/script/create_xml.sh が一日一度動作するように登録する(電波が送出されており、チューナをあまり使用しない時間帯がベスト)
* config.json を環境に合わせて書き換える(server_ip とチューナデバイス名は環境に合わせる)
* server_ip とは書いてあるが FQDN も指定可能。ブラウザ側からのアドレス解決が出来るものであれば可。IPv4, IPv6, ホスト名何でもOK

## tacchin の起動
```
sudo systemctl start nginx
/PATH/TO/tacchin/node.js/tacchin/bin/www
```
tacchin/bin/www が異常終了した場合、起動しなおしてあげてください。
状態を保存するファイルを使用していないので、問題なく起動するはずです。
recpt1, ffmpeg がバックグラウンドで残った状態となってしまった場合、kill で終了してください。

## ToDo
 * 再生画面 → 番組一覧 → 別チャンネル視聴 を5秒以内に実施すると、チャンネル変更されない(現状の仕様)
 * 番組表から番組をクリックした際に、グルグル回る画面で待たされる場合、ブラウザのリロードを実施すると吉
 * 番組表から番組をクリックした際に、エラーとなり再生できない場合がある(シングルクォート等のencodeをしていないため)
 * 番組表に出力する放送局の選択を`channel_config.json`で出来るようにする
 * 現状2ストリームの同時再生が出来ない(ffmpeg の dash muxer の出力命名規則の仕様)
 * チャンネルの切り替え機能実装
 * ffmpeg の音声選択が多分、複数音声構成の場合にマズイ。番組表.jsonに音声構成が入っているみたいなので、そっちから引き継いで何とか出来ないか？
 * 番組情報JSONの解析を行ってHTMLの作成をサーバサイドでやりたい(JSONをそのまま渡すとサイズが大きい)
 * 再生中画面の中に番組表を差し込んで、そこからチャンネル変更出来るようにしたい
 * サーバ → player 側に再生停止の命令の発行
 * サーバ → player 側に再生開始の命令の発行
 * 各放送局ごとにエンコード時に割り当てるべきビットレートの設定ファイル化と、ffmpeg へのインタフェースについての検討(`channel_config.json`でもいいか)
