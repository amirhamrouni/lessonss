package com.amirhamrouni.englishtwin;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.speech.tts.TextToSpeech;
import android.speech.tts.Voice;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialException;

import com.google.android.libraries.identity.googleid.GetGoogleIdOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

import org.json.JSONObject;

import java.util.Locale;
import java.util.Set;

public class MainActivity extends ComponentActivity {
    private static final String APP_URL = "https://english-twin-native-preview.vercel.app/";
    private static final String APP_HOST = "english-twin-native-preview.vercel.app";
    private static final int MEDIA_PERMISSION_REQUEST = 1001;
    private static final float DEFAULT_TEACHER_RATE = 0.92f;
    private static final float DEFAULT_TEACHER_PITCH = 1.0f;

    private WebView webView;
    private PermissionRequest pendingWebPermissionRequest;
    private CredentialManager credentialManager;
    private TextToSpeech textToSpeech;
    private boolean textToSpeechReady = false;
    private String pendingSpeechText;
    private float pendingSpeechRate = DEFAULT_TEACHER_RATE;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        credentialManager = CredentialManager.create(this);
        textToSpeech = new TextToSpeech(this, status -> {
            if (status != TextToSpeech.SUCCESS || textToSpeech == null) return;
            int languageStatus = textToSpeech.setLanguage(Locale.US);
            textToSpeechReady = languageStatus != TextToSpeech.LANG_MISSING_DATA && languageStatus != TextToSpeech.LANG_NOT_SUPPORTED;
            if (textToSpeechReady) {
                configureNaturalTeacherVoice();
                if (pendingSpeechText != null) {
                    String text = pendingSpeechText;
                    float rate = pendingSpeechRate;
                    pendingSpeechText = null;
                    speakNativeEnglish(text, rate);
                }
            }
        });

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        webView.addJavascriptInterface(new NativeBridge(), "EnglishTwinAndroid");
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equalsIgnoreCase(uri.getScheme()) && APP_HOST.equalsIgnoreCase(uri.getHost())) {
                    return false;
                }
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (Exception ignored) {
                    sendNativeAuthError("Unable to open this external link.");
                }
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if (url != null && url.startsWith(APP_URL)) installNativeSpeechFallback();
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> handleWebPermissionRequest(request));
            }
        });

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });

        if (savedInstanceState == null) webView.loadUrl(APP_URL);
        else webView.restoreState(savedInstanceState);
    }

    private final class NativeBridge {
        @JavascriptInterface
        public void signInWithGoogle() {
            runOnUiThread(() -> startNativeGoogleSignIn(false));
        }

        @JavascriptInterface
        public void speakEnglish(String text, double rate) {
            if (text == null || text.trim().isEmpty()) return;
            float requestedRate = (float) rate;
            float safeRate = Math.max(0.86f, Math.min(1.08f, requestedRate <= 0f ? DEFAULT_TEACHER_RATE : requestedRate));
            runOnUiThread(() -> speakNativeEnglish(text.trim(), safeRate));
        }

        @JavascriptInterface
        public void stopSpeech() {
            runOnUiThread(() -> {
                pendingSpeechText = null;
                if (textToSpeech != null) textToSpeech.stop();
            });
        }
    }

    private void configureNaturalTeacherVoice() {
        if (textToSpeech == null) return;
        textToSpeech.setLanguage(Locale.US);
        textToSpeech.setPitch(DEFAULT_TEACHER_PITCH);
        textToSpeech.setSpeechRate(DEFAULT_TEACHER_RATE);

        Set<Voice> voices = textToSpeech.getVoices();
        if (voices == null || voices.isEmpty()) return;

        Voice best = null;
        int bestScore = Integer.MIN_VALUE;
        for (Voice voice : voices) {
            Locale locale = voice.getLocale();
            if (locale == null || !"en".equalsIgnoreCase(locale.getLanguage())) continue;

            String name = voice.getName() == null ? "" : voice.getName().toLowerCase(Locale.ROOT);
            if (name.contains("child") || name.contains("robot")) continue;

            int score = voice.getQuality();
            if (Locale.US.getCountry().equalsIgnoreCase(locale.getCountry())) score += 700;
            else if (Locale.UK.getCountry().equalsIgnoreCase(locale.getCountry())) score += 500;
            else score += 200;

            if (name.contains("neural") || name.contains("natural") || name.contains("enhanced") || name.contains("wavenet")) score += 1200;
            if (voice.getFeatures() != null && voice.getFeatures().contains(TextToSpeech.Engine.KEY_FEATURE_NETWORK_SYNTHESIS)) score += 350;
            if (!voice.isNetworkConnectionRequired()) score += 120;
            score -= Math.max(0, voice.getLatency() / 10);

            if (best == null || score > bestScore) {
                best = voice;
                bestScore = score;
            }
        }

        if (best != null) textToSpeech.setVoice(best);
    }

    private void speakNativeEnglish(String text, float rate) {
        if (textToSpeech == null || !textToSpeechReady) {
            pendingSpeechText = text;
            pendingSpeechRate = rate;
            return;
        }
        textToSpeech.stop();
        configureNaturalTeacherVoice();
        textToSpeech.setSpeechRate(Math.max(0.86f, Math.min(1.08f, rate)));
        textToSpeech.setPitch(DEFAULT_TEACHER_PITCH);
        textToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, null, "english-twin-teacher-tts-" + System.currentTimeMillis());
    }

    private void installNativeSpeechFallback() {
        if (webView == null) return;
        String js = "(function(){" +
                "if(!window.EnglishTwinAndroid||!window.EnglishTwinAndroid.speakEnglish)return;" +
                "var bridge=window.EnglishTwinAndroid;" +
                "if(typeof window.SpeechSynthesisUtterance==='undefined'){window.SpeechSynthesisUtterance=function(text){this.text=String(text||'');this.lang='en-US';this.rate=0.92;this.pitch=1;this.volume=1;};}" +
                "var nativeSpeak=function(u){try{bridge.speakEnglish(String((u&&u.text)||''),Number((u&&u.rate)||0.92));}catch(e){}};" +
                "var nativeCancel=function(){try{bridge.stopSpeech();}catch(e){}};" +
                "try{" +
                "if(!window.speechSynthesis){Object.defineProperty(window,'speechSynthesis',{value:{speak:nativeSpeak,cancel:nativeCancel,pause:nativeCancel,resume:function(){},getVoices:function(){return[];}},configurable:true});}" +
                "else{window.speechSynthesis.speak=nativeSpeak;window.speechSynthesis.cancel=nativeCancel;window.speechSynthesis.pause=nativeCancel;}" +
                "}catch(e){}" +
                "})();";
        webView.evaluateJavascript(js, null);
    }

    private void startNativeGoogleSignIn(boolean authorizedOnly) {
        String webClientId = getString(R.string.default_web_client_id);
        if (webClientId == null || webClientId.trim().isEmpty() || "MISSING_GOOGLE_WEB_CLIENT_ID".equals(webClientId)) {
            sendNativeAuthError("Native Google Sign-In is not configured: missing Web OAuth client ID.");
            return;
        }

        GetGoogleIdOption googleIdOption = new GetGoogleIdOption.Builder()
                .setServerClientId(webClientId)
                .setFilterByAuthorizedAccounts(authorizedOnly)
                .build();
        GetCredentialRequest request = new GetCredentialRequest.Builder().addCredentialOption(googleIdOption).build();

        credentialManager.getCredentialAsync(
                this,
                request,
                new CancellationSignal(),
                Runnable::run,
                new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    @Override
                    public void onResult(@NonNull GetCredentialResponse result) {
                        Credential credential = result.getCredential();
                        if (credential instanceof CustomCredential && GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(credential.getType())) {
                            try {
                                GoogleIdTokenCredential googleCredential = GoogleIdTokenCredential.createFrom(credential.getData());
                                sendNativeGoogleIdToken(googleCredential.getIdToken());
                            } catch (Exception error) {
                                sendNativeAuthError("Google credential could not be parsed.");
                            }
                        } else sendNativeAuthError("Google did not return a supported credential.");
                    }

                    @Override
                    public void onError(@NonNull GetCredentialException error) {
                        String message = error.getMessage();
                        sendNativeAuthError(message == null || message.trim().isEmpty() ? "Google Sign-In failed." : message);
                    }
                }
        );
    }

    private void sendNativeGoogleIdToken(String idToken) {
        runOnUiThread(() -> {
            if (webView == null) return;
            String js = "window.__englishTwinNativeGoogleCredential && window.__englishTwinNativeGoogleCredential(" + JSONObject.quote(idToken) + ")";
            webView.evaluateJavascript(js, null);
        });
    }

    private void sendNativeAuthError(String message) {
        runOnUiThread(() -> {
            if (webView == null) return;
            String js = "window.__englishTwinNativeGoogleError && window.__englishTwinNativeGoogleError(" + JSONObject.quote(message) + ")";
            webView.evaluateJavascript(js, null);
        });
    }

    private void handleWebPermissionRequest(PermissionRequest request) {
        pendingWebPermissionRequest = request;
        boolean needsMic = false;
        boolean needsCamera = false;
        for (String resource : request.getResources()) {
            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) needsMic = true;
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) needsCamera = true;
        }

        boolean micGranted = !needsMic || checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
        boolean cameraGranted = !needsCamera || checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
        if (micGranted && cameraGranted) {
            request.grant(request.getResources());
            pendingWebPermissionRequest = null;
            return;
        }

        if (needsMic && needsCamera) requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO, Manifest.permission.CAMERA}, MEDIA_PERMISSION_REQUEST);
        else if (needsMic) requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, MEDIA_PERMISSION_REQUEST);
        else if (needsCamera) requestPermissions(new String[]{Manifest.permission.CAMERA}, MEDIA_PERMISSION_REQUEST);
        else {
            request.deny();
            pendingWebPermissionRequest = null;
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == MEDIA_PERMISSION_REQUEST && pendingWebPermissionRequest != null) {
            boolean allGranted = grantResults.length > 0;
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }
            if (allGranted) pendingWebPermissionRequest.grant(pendingWebPermissionRequest.getResources());
            else pendingWebPermissionRequest.deny();
            pendingWebPermissionRequest = null;
        }
    }

    @Override
    protected void onSaveInstanceState(@NonNull Bundle outState) {
        if (webView != null) webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onDestroy() {
        if (pendingWebPermissionRequest != null) {
            pendingWebPermissionRequest.deny();
            pendingWebPermissionRequest = null;
        }
        if (textToSpeech != null) {
            textToSpeech.stop();
            textToSpeech.shutdown();
            textToSpeech = null;
        }
        if (webView != null) {
            webView.removeJavascriptInterface("EnglishTwinAndroid");
            webView.stopLoading();
            webView.setWebChromeClient(null);
            webView.setWebViewClient(null);
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
