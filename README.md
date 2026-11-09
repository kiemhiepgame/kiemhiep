# Kiếm Hiệp 3D - Web Prototype

Chạy bằng một web server (không mở trực tiếp file HTML vì ES modules có thể bị chặn).

## Chạy nhanh
- VS Code: cài Live Server rồi mở `index.html`.
- Hoặc: `python -m http.server 8000` trong thư mục dự án.

## Kiến trúc production theo yêu cầu
- Asset: GLB/GLTF.
- Texture: ưu tiên KTX2/WebP, PBR với ORM packing (R=AO, G=Roughness, B=Metallic).
- Environment: bake Lightmap vào UV2; không bật shadow realtime cho cảnh tĩnh.
- VFX: billboard 2D + emission.
- Nước/mây: shader UV scrolling.
- Post: Bloom + ACES Filmic tone mapping + FXAA.

Lưu ý: Prototype dùng hình học tạo bằng code để chạy ngay, chưa bao gồm asset GLB/KTX2/HDRI thương mại.
