{
  "targets": [{
    "target_name": "stealth_overlay",
    "sources": ["src/main.cpp"],
    "include_dirs": ["<!(node -e \"require('nan')\")"],
    "libraries": ["user32.lib", "gdi32.lib"],
    "defines": [
      "NOMINMAX",
      "WIN32_LEAN_AND_MEAN"
    ],
    "msvs_settings": {
      "VCCLCompilerTool": {
        "ExceptionHandling": 1,
        "AdditionalOptions": ["/Zc:__cplusplus"]
      }
    }
  }]
}