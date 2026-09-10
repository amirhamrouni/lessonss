package com.amirhamrouni.englishtwin;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.CancellationSignal;
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

public class MainActivity extends ComponentActivity {
    private static final String APP_URL = "https://english-twin-native-preview.vercel.app/";
    private static final String APP_HOST = "english-twin-native-preview.vercel.app";
    private static final int MEDIA_PERMISSION_REQUEST = 1001;

    private WebView webView;
    private PermissionRequest pendingWebPermissionRequest;
    private CredentialManager credentialManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        credentialManager = CredentialManager.create(this);
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

        webView.addJavascriptInterface(new NativeAuthBridge(), "EnglishTwinAndroid");
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

        if (savedInstanceState == null) {
            webView.loadUrl(APP_URL);
        } else {
            webView.restoreState(savedInstanceState);
        }
    }

    private final class NativeAuthBridge {
        @JavascriptInterface
        public void signInWithGoogle() {
            runOnUiThread(() -> startNativeGoogleSignIn(false));
        }
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

        GetCredentialRequest request = new GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build();

        credentialManager.getCredentialAsync(
                this,
                request,
                new CancellationSignal(),
                Runnable::run,
                new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    @Override
                    public void onResult(@NonNull GetCredentialResponse result) {
                        Credential credential = result.getCredential();
                        if (credential instanceof CustomCredential &&
                                GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(credential.getType())) {
                            try {
                                GoogleIdTokenCredential googleCredential = GoogleIdTokenCredential.createFrom(credential.getData());
                                sendNativeGoogleIdToken(googleCredential.getIdToken());
                            } catch (Exception error) {
                                sendNativeAuthError("Google credential could not be parsed.");
                            }
                        } else {
                            sendNativeAuthError("Google did not return a supported credential.");
                        }
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

        if (needsMic && needsCamera) {
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO, Manifest.permission.CAMERA}, MEDIA_PERMISSION_REQUEST);
        } else if (needsMic) {
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, MEDIA_PERMISSION_REQUEST);
        } else if (needsCamera) {
            requestPermissions(new String[]{Manifest.permission.CAMERA}, MEDIA_PERMISSION_REQUEST);
        } else {
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

            if (allGranted) {
                pendingWebPermissionRequest.grant(pendingWebPermissionRequest.getResources());
            } else {
                pendingWebPermissionRequest.deny();
            }
            pendingWebPermissionRequest = null;
        }
    }

    @Override
    protected void onSaveInstanceState(@NonNull Bundle outState) {
        if (webView != null) {
            webView.saveState(outState);
        }
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onDestroy() {
        if (pendingWebPermissionRequest != null) {
            pendingWebPermissionRequest.deny();
            pendingWebPermissionRequest = null;
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
