# URL共有連携実装計画

## 概要
FlutterアプリのWebViewで表示しているPodCast管理アプリに、他のアプリからURL共有を受け取ってシームレスにPodcastを追加できる機能を実装します。

## ユーザーフロー

```
他のアプリ（YouTube、Spotify等）
    ↓ 「共有」ボタン
FlutterアプリがURL共有を受け取る（Intent/Universal Link）
    ↓ URLをWebViewに渡す
Webアプリがクエリパラメータを検出
    ↓ 自動的にメタデータ取得
Podcast追加フォームにデータを自動入力
    ↓ ユーザーが確認・編集
追加ボタンをクリックして完了
```

---

## 🔷 Flutterアプリ側の実装（ユーザーが実装）

### 1. パッケージ追加

`pubspec.yaml`に以下を追加：

```yaml
dependencies:
  receive_sharing_intent: ^1.5.1  # URL共有を受け取る
  flutter_inappwebview: ^6.0.0   # WebView（既に使用中の場合は不要）
```

### 2. プラットフォーム設定

#### Android: `android/app/src/main/AndroidManifest.xml`

```xml
<manifest>
  <application>
    <activity android:name=".MainActivity">
      <!-- 既存の設定... -->

      <!-- URL共有を受け取る設定 -->
      <intent-filter>
        <action android:name="android.intent.action.SEND" />
        <category android:name="android.intent.category.DEFAULT" />
        <data android:mimeType="text/plain" />
      </intent-filter>
    </activity>
  </application>
</manifest>
```

#### iOS: `ios/Runner/Info.plist`

```xml
<dict>
  <!-- 既存の設定... -->

  <!-- URL共有を受け取る設定 -->
  <key>NSAppTransportSecurity</key>
  <dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
  </dict>

  <key>CFBundleURLTypes</key>
  <array>
    <dict>
      <key>CFBundleTypeRole</key>
      <string>Editor</string>
      <key>CFBundleURLName</key>
      <string>com.yourapp.podqueue</string>
      <key>CFBundleURLSchemes</key>
      <array>
        <string>podqueue</string>
      </array>
    </dict>
  </array>
</dict>
```

### 3. Flutterコード実装例

```dart
import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:receive_sharing_intent/receive_sharing_intent.dart';
import 'dart:async';

class WebViewPage extends StatefulWidget {
  @override
  _WebViewPageState createState() => _WebViewPageState();
}

class _WebViewPageState extends State<WebViewPage> {
  late InAppWebViewController _webViewController;
  StreamSubscription? _intentDataStreamSubscription;
  String baseUrl = 'https://your-podcast-app.com';

  @override
  void initState() {
    super.initState();

    // アプリが起動中に共有を受け取る
    _intentDataStreamSubscription = ReceiveSharingIntent.getTextStream().listen((String value) {
      _handleSharedUrl(value);
    }, onError: (err) {
      print("共有エラー: $err");
    });

    // アプリが閉じている状態から共有で起動
    ReceiveSharingIntent.getInitialText().then((String? value) {
      if (value != null) {
        _handleSharedUrl(value);
      }
    });
  }

  void _handleSharedUrl(String sharedUrl) {
    // URLをエンコードしてWebViewに渡す
    final encodedUrl = Uri.encodeComponent(sharedUrl);
    final targetUrl = '$baseUrl/podcasts?shared_url=$encodedUrl&auto_fetch=true';

    _webViewController.loadUrl(
      urlRequest: URLRequest(url: Uri.parse(targetUrl))
    );
  }

  @override
  void dispose() {
    _intentDataStreamSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: InAppWebView(
          initialUrlRequest: URLRequest(url: Uri.parse('$baseUrl/podcasts')),
          onWebViewCreated: (controller) {
            _webViewController = controller;
          },
          initialOptions: InAppWebViewGroupOptions(
            crossPlatform: InAppWebViewOptions(
              useShouldOverrideUrlLoading: true,
              mediaPlaybackRequiresUserGesture: false,
            ),
          ),
        ),
      ),
    );
  }
}
```

---

## 🔷 Webアプリ側の実装（このリポジトリで実装）

### 1. URLクエリパラメータの検出と処理

#### 実装場所: `/app/podcasts/page.tsx`

**変更内容:**
- クエリパラメータ `shared_url` を検出
- `auto_fetch=true` の場合、自動的にメタデータ取得を実行

#### 実装場所: `/components/podcasts-container.tsx`

**変更内容:**
- クエリパラメータを `AddPodcastForm` に渡す

#### 実装場所: `/components/add-podcast-form.tsx`

**変更内容:**
1. `initialUrl` と `autoFetch` プロパティを追加
2. 初期値として `initialUrl` を設定
3. `autoFetch=true` の場合、自動的に `handleFetchMetadata` を実行
4. メタデータ取得後、フォームを表示（確認・編集可能）

### 2. 実装の詳細

#### Step 1: `podcasts-container.tsx` の更新
- `useSearchParams` でクエリパラメータを取得
- `shared_url` と `auto_fetch` を `AddPodcastForm` に渡す

#### Step 2: `add-podcast-form.tsx` の更新
- Props に `initialUrl?: string` と `autoFetch?: boolean` を追加
- `useEffect` で初期URLをセット＆自動メタデータ取得
- ユーザーエクスペリエンス向上のため、自動取得中はローディング表示

#### Step 3: オプション機能（推奨）
- 追加完了後、クエリパラメータをクリア（`router.replace('/podcasts')`）
- 自動追加後の成功トースト通知

### 3. クエリパラメータ仕様

| パラメータ | 説明 | 例 |
|----------|------|-----|
| `shared_url` | 追加したいPodcastのURL（URLエンコード必須） | `?shared_url=https%3A%2F%2Fyoutube.com%2Fwatch%3Fv%3DxxxYYY` |
| `auto_fetch` | メタデータ自動取得フラグ（`true`/`false`） | `?shared_url=...&auto_fetch=true` |

### 4. セキュリティ考慮事項

- URLバリデーション: 不正なURLをチェック（既存の `detectPlatform` で対応）
- 認証確認: 未ログインの場合はログインページにリダイレクト（既存の実装で対応済み）
- XSS対策: URLエンコード/デコードを適切に処理

---

## 実装優先順位

### Phase 1: 基本機能（必須）
1. ✅ `podcasts-container.tsx` でクエリパラメータを取得
2. ✅ `add-podcast-form.tsx` に初期URL設定機能を追加
3. ✅ クエリパラメータからURLを受け取り、フォームに自動入力

### Phase 2: 自動化（推奨）
4. ✅ `auto_fetch=true` で自動的にメタデータ取得
5. ✅ メタデータ取得後にフォームを自動的に表示

### Phase 3: UX改善（オプション）
6. ⭕ 追加完了後、成功トースト通知
7. ⭕ 追加完了後、クエリパラメータをクリア
8. ⭕ エラーハンドリングの強化

---

## テスト方法

### Webアプリ単体テスト

ブラウザで以下のURLにアクセスして動作確認：

```
https://your-app.com/podcasts?shared_url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ&auto_fetch=true
```

期待動作：
1. Podcast追加フォームが開く
2. URLフィールドに自動入力される
3. 自動的にメタデータを取得開始
4. タイトル・説明・サムネイルが自動入力される
5. ユーザーが確認して「追加」ボタンをクリック

### Flutter + Web 統合テスト

1. Flutterアプリを起動
2. YouTube/Spotifyアプリで動画・Podcastを開く
3. 「共有」→Flutterアプリを選択
4. WebViewで自動的にPodcast追加画面が開くことを確認

---

## まとめ

### Flutter側でやること
1. パッケージ追加（`receive_sharing_intent`）
2. AndroidManifest.xml / Info.plist の設定
3. 共有URL受け取りロジックの実装
4. WebViewにクエリパラメータ付きURLをロード

### Web側でやること（このリポジトリ）
1. `podcasts-container.tsx` の更新
2. `add-podcast-form.tsx` の更新
3. クエリパラメータの検出・処理
4. 自動メタデータ取得

この計画により、他のアプリからの共有→Podcast追加まで、ほぼタップ1回でシームレスに連携できます。
