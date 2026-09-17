/**
 * Model gắn cứng cho từng việc
 * Tra từ danh sách chính thức: https://ai.google.dev/gemini-api/docs/models
 *
 * HAI ĐIỀU ĐÃ KIỂM CHỨNG BẰNG LỖI THẬT — đừng lặp lại:
 *
 * 1. Model Live ở đây là AUDIO-ONLY. Đặt responseModalities: ["TEXT"] bị từ chối:
 *      mã 1007: The requested combination of response modalities (TEXT)
 *               is not supported by the model
 *    => Không sinh được văn bản/JSON qua phiên Live. Việc sinh chữ bắt buộc
 *       phải đi REST generateContent với model thường.
 *
 * 2. Số phiên Live mở đồng thời có giới hạn. Mở Sensei + 3 diễn viên cùng lúc
 *    thì phiên mới bị đóng với mã 1000 (đóng "bình thường", không báo lý do).
 *    => Lồng tiếng chạy TUẦN TỰ: mỗi lúc chỉ một phiên diễn viên.
 *
 * Phân bổ quota: việc NẶNG (audio suốt buổi học) đi Live để hưởng Unlimited;
 * việc NHẸ (soạn đề mỗi bài một lần, câu nhận xét mỗi câu trắc nghiệm) đi REST —
 * tần suất thấp nên hạn mức generateContent thừa sức gánh.
 */
window.SENSEI_MODELS = {
  /** Thầy giáo — phiên Live hai chiều suốt buổi. Đã chạy thật trên key này. */
  sensei: 'models/gemini-3.8-live',

  /**
   * Lồng tiếng nhân vật — phiên Live khoá sẵn giọng, MỖI LÚC MỘT PHIÊN.
   * Không dùng model TTS vì TTS không thuộc nhóm Unlimited.
   */
  actor: 'models/gemini-3.1-flash-live-preview',
  actorFallback: 'models/gemini-3.8-live',

  /**
   * Soạn đề bài tập — sinh JSON qua REST generateContent.
   *
   * Hai model lite, dùng XEN KẼ chứ không phải chính/phụ: hạn mức tính riêng
   * cho từng model, nên luôn gọi một model trước sẽ làm nó cạn trong khi model
   * kia còn nguyên. Xen kẽ thì mỗi bên gánh một nửa.
   *
   * Bản flash thường (3.8-flash, 3.5-flash) đã bị bỏ: hạn mức free tier của
   * chúng chỉ 20 lượt và thực tế đo được là 429 rồi 503 liên tục.
   */
  quizModels: [
    'models/gemini-3.5-flash-lite',
    'models/gemini-3.1-flash-lite',
  ],

  /** Câu nhận xét sau mỗi câu trắc nghiệm — cần nhanh và rẻ */
  roast: 'models/gemini-3.5-flash-lite',
};
