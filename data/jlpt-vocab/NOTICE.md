# Nguồn dữ liệu và giấy phép

Các file `n5.csv` … `n1.csv` trong thư mục này là danh sách từ vựng phân theo
cấp JLPT (không chia theo bài học), dùng làm **nguồn tuyển chọn từ vựng** cho
giáo án — thay vì tái tạo lại đúng danh mục từng bài của một cuốn sách cụ thể.

## Gốc dữ liệu

```
Chuỗi kế thừa:
  tanos.co.uk (Jonathan Waller)         -- CC BY
    -> chyyran/jlpt-anki-decks (GitHub)
    -> elzup/jlpt-word-list (GitHub)    -- MIT License
    -> file trong thư mục này
```

- **Tanos JLPT lists** — <http://www.tanos.co.uk/jlpt/sharing/>
  Giấy phép: *"Everything on this site (that I'm not selling), is licenced
  under Creative Commons 'BY'. […] use anything here however you like
  (commercial or non-commercial), but credit my site."*
- **elzup/jlpt-word-list** — <https://github.com/elzup/jlpt-word-list>
  Giấy phép: MIT (ghi rõ trong file `LICENSE` của repo gốc).

Ghi công: dữ liệu từ vựng bắt nguồn từ **tanos.co.uk (Jonathan Waller)**,
qua trung gian **elzup/jlpt-word-list**.

## Vì sao dùng nguồn này thay vì bám sách giáo trình

Xem [[minna-copyright-boundary]] trong ghi chú dự án. Tóm tắt: các giáo
trình có bài học cụ thể (Minna no Nihongo, Irodori, Marugoto…) đều cấm dùng
để xây sản phẩm thương mại hoặc bán lại tài liệu chuyển thể. Bản thân từ
vựng và nghĩa của nó không có bản quyền, nhưng **cách MỘT NHÀ XUẤT BẢN chọn
và nhóm từ theo từng bài** có thể được bảo hộ như một compilation riêng.

Do đó: khung ngữ pháp theo trình tự N5→N1 (không ai độc quyền được) vẫn giữ,
nhưng từ vựng minh họa mỗi bài được **tự chọn** từ pool phẳng theo cấp ở
đây — không tái tạo lại đúng bảng từ của bất kỳ bài học nào trong sách cụ
thể nào.

## Định dạng file

```csv
expression,reading,meaning,tags
現像,げんぞう,developing (film),JLPT_1 JLPT
```

`meaning` là tiếng Anh (gốc từ Tanos). Nghĩa tiếng Việt trong `curriculum/*.json`
là tự dịch/tự soạn, không có nguồn mở nào cung cấp sẵn.
