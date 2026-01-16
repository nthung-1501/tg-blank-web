export const GAME_CONFIG = {
  gameName: "Đóng Ấn KT",
  dailyTitle: "Chủ đề hôm nay: Kiến thức tổng hợp",
};

export type Question = {
  id: string;
  text: string;      // có "...."
  answers: string[]; // đáp án đúng (nhiều lựa chọn)
  hint?: string;
};

export const QUESTIONS_TODAY: Question[] = [
  { id: "q1", text: "Thủ đô Việt Nam là ....", answers: ["hà nội", "ha noi"] },
  { id: "q2", text: "Hành tinh gần Mặt Trời nhất là ....", answers: ["sao thủy", "thủy tinh", "mercury"] },
  { id: "q3", text: "Tác giả Truyện Kiều là ....", answers: ["nguyễn du", "nguyen du"] },
  { id: "q4", text: "Đơn vị đo cường độ dòng điện là ....", answers: ["ampe", "ampere", "a"] },
  { id: "q5", text: "Đại .... Dương là đại dương lớn nhất.", answers: ["thái bình", "thai binh", "pacific"], hint: "Gợi ý: ____ Dương" },
];
