#define NOMINMAX
#define WIN32_LEAN_AND_MEAN

#include <nan.h>
#include <windows.h>

HWND g_hwnd = nullptr;
bool g_visible = false;

LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    return DefWindowProc(hwnd, msg, wParam, lParam);
}

NAN_METHOD(Create) {
    int width = Nan::To<int>(info[0]).FromJust();
    int height = Nan::To<int>(info[1]).FromJust();

    HINSTANCE hInst = GetModuleHandle(NULL);

    WNDCLASSW wc = {};
    wc.lpfnWndProc = WndProc;
    wc.hInstance = hInst;
    wc.lpszClassName = L"StealthOverlayClass";
    RegisterClassW(&wc);

    g_hwnd = CreateWindowExW(
        WS_EX_LAYERED | WS_EX_TOPMOST | WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE | WS_EX_TRANSPARENT,
        L"StealthOverlayClass", L"", WS_POPUP,
        100, 100, width, height, NULL, NULL, hInst, NULL);

    if (g_hwnd) {
        SetLayeredWindowAttributes(g_hwnd, RGB(0,0,0), 245, LWA_ALPHA);
        
        // Explicit declaration for SetWindowDisplayAffinity
        typedef BOOL (WINAPI *pSetWindowDisplayAffinity)(HWND, DWORD);
        HMODULE user32 = GetModuleHandleA("user32.dll");
        pSetWindowDisplayAffinity setAffinity = (pSetWindowDisplayAffinity)GetProcAddress(user32, "SetWindowDisplayAffinity");
        if (setAffinity) {
            setAffinity(g_hwnd, 0x00000011); // WDA_EXCLUDEFROMCAPTURE
        }

        ShowWindow(g_hwnd, SW_SHOW);
        g_visible = true;
        info.GetReturnValue().Set(Nan::True());
        return;
    }
    info.GetReturnValue().Set(Nan::False());
}

NAN_METHOD(Show) { 
    if (g_hwnd) ShowWindow(g_hwnd, SW_SHOW); 
    g_visible = true; 
}

NAN_METHOD(Hide) { 
    if (g_hwnd) ShowWindow(g_hwnd, SW_HIDE); 
    g_visible = false; 
}

NAN_METHOD(Toggle) { 
    g_visible ? Hide(info) : Show(info); 
}

NAN_METHOD(Move) {
    if (g_hwnd) {
        int x = Nan::To<int>(info[0]).FromJust();
        int y = Nan::To<int>(info[1]).FromJust();
        SetWindowPos(g_hwnd, HWND_TOPMOST, x, y, 0, 0, SWP_NOSIZE | SWP_NOACTIVATE);
    }
}

NAN_METHOD(SetClickThrough) {
    if (g_hwnd) {
        bool enable = Nan::To<bool>(info[0]).FromJust();
        LONG ex = GetWindowLong(g_hwnd, GWL_EXSTYLE);
        SetWindowLong(g_hwnd, GWL_EXSTYLE, enable ? (ex | WS_EX_TRANSPARENT) : (ex & ~WS_EX_TRANSPARENT));
    }
}

NAN_METHOD(SetOpacity) {
    if (g_hwnd) {
        int alpha = Nan::To<int>(info[0]).FromJust();
        SetLayeredWindowAttributes(g_hwnd, RGB(0,0,0), (BYTE)alpha, LWA_ALPHA);
    }
}

NAN_MODULE_INIT(Init) {
    Nan::Set(target, Nan::New("create").ToLocalChecked(), Nan::GetFunction(Nan::New<v8::FunctionTemplate>(Create)).ToLocalChecked());
    Nan::Set(target, Nan::New("show").ToLocalChecked(), Nan::GetFunction(Nan::New<v8::FunctionTemplate>(Show)).ToLocalChecked());
    Nan::Set(target, Nan::New("hide").ToLocalChecked(), Nan::GetFunction(Nan::New<v8::FunctionTemplate>(Hide)).ToLocalChecked());
    Nan::Set(target, Nan::New("toggle").ToLocalChecked(), Nan::GetFunction(Nan::New<v8::FunctionTemplate>(Toggle)).ToLocalChecked());
    Nan::Set(target, Nan::New("move").ToLocalChecked(), Nan::GetFunction(Nan::New<v8::FunctionTemplate>(Move)).ToLocalChecked());
    Nan::Set(target, Nan::New("setClickThrough").ToLocalChecked(), Nan::GetFunction(Nan::New<v8::FunctionTemplate>(SetClickThrough)).ToLocalChecked());
    Nan::Set(target, Nan::New("setOpacity").ToLocalChecked(), Nan::GetFunction(Nan::New<v8::FunctionTemplate>(SetOpacity)).ToLocalChecked());
}

NODE_MODULE(stealth_overlay, Init)