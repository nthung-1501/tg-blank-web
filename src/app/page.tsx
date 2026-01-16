"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Telegram?: any;
  }
}

export default function Home() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioOn, setAudioOn] = useState(false);

  // Nếu mở trong Telegram Mini App thì expand cho full height
  useEffect(() => {
    try {
      window.Telegram?.WebApp?.ready?.();
      window.Telegram?.WebApp?.expand?.();
    } catch {}
  }, []);

  // Tự tạo id/name tạm để test nếu chưa có Telegram initData
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("tgUserId")) {
      localStorage.setItem("tgUserId", String(Math.floor(Math.random() * 10_000_000)));
    }
    if (!localStorage.getItem("tgName")) {
      localStorage.setItem("tgName", "Người chơi");
    }
  }, []);

  async function enableAudio() {
    const a = audioRef.current;
    if (!a) return;
    try {
      a.volume = 0.55;
      await a.play();
      setAudioOn(true);
    } catch {
      // Nếu vẫn bị chặn, user bấm lại sẽ được
      setAudioOn(false);
    }
  }

  function start() {
    router.push("/game");
  }

  return (
    <main className={styles.stage} onPointerDown={() => (!audioOn ? enableAudio() : null)}>
      {/* Background sky + clouds + sun */}
      <div className={styles.sky}>
        <div className={styles.sunWrap}>
          <div className={styles.sun} />
          <div className={styles.sunGlow} />
        </div>

        <div className={`${styles.cloud} ${styles.cloud1}`} />
        <div className={`${styles.cloud} ${styles.cloud2}`} />
        <div className={`${styles.cloud} ${styles.cloud3}`} />
      </div>

      {/* Meadow */}
      <div className={styles.meadow}>
        <div className={styles.hills} />
        <div className={styles.grass} />

        {/* Cow */}
        <div className={styles.cowWrap} aria-hidden="true">
          <div className={styles.cow}>
            <div className={styles.cowEarLeft} />
            <div className={styles.cowEarRight} />
            <div className={styles.cowHead}>
              <div className={styles.cowSpot1} />
              <div className={styles.cowSpot2} />
              <div className={styles.cowEyes}>
                <span className={styles.eye} />
                <span className={styles.eye} />
              </div>
              <div className={styles.cowMouth} />
            </div>
            <div className={styles.cowBody}>
              <div className={styles.cowBelly} />
              <div className={styles.cowLegs}>
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className={styles.cowTail} />
            </div>
          </div>

          {/* sparkles */}
          <div className={styles.sparkles}>
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>

        {/* UI Card */}
        <section className={styles.card} role="region" aria-label="Game Home">
          <div className={styles.brandTop}>
            <div className={styles.logoDot} />
            <div className={styles.brandText}>
              <div className={styles.title}>Đóng Ấn KT</div>
              <div className={styles.subtitle}>
                Mỗi ngày 5 câu • Điền từ vào chỗ trống • Chấm +1/câu
              </div>
            </div>
          </div>

          <button className={styles.startBtn} onClick={start}>
            Bắt đầu
          </button>

          <div className={styles.hint}>
            {!audioOn ? (
              <>
                <b>Chạm màn hình</b> để bật nhạc nền 🎵
              </>
            ) : (
              <>Nhạc nền đang bật 🎶</>
            )}
          </div>

          <div className={styles.smallNote}>
            Tip: Nếu bạn muốn đặt tên hiển thị, hãy mở menu Telegram và đổi tên tài khoản,
            hoặc mình sẽ thêm phần “nhập tên” ở Home.
          </div>
        </section>
      </div>

      {/* audio (đặt file vào public/audio) */}
      <audio ref={audioRef} loop preload="auto">
        <source src="/audio/home-bgm.mp3" type="audio/mpeg" />
      </audio>

      {/* floating button to toggle audio */}
      <button
        className={styles.audioFab}
        onClick={(e) => {
          e.stopPropagation();
          if (!audioOn) enableAudio();
          else {
            const a = audioRef.current;
            if (a) a.pause();
            setAudioOn(false);
          }
        }}
        aria-label="Toggle audio"
        title="Âm thanh"
      >
        {audioOn ? "🔊" : "🔈"}
      </button>
    </main>
  );
}
