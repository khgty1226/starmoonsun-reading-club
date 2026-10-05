import { motion } from "motion/react";
import starmoonsun from "./assets/starmoonsun_deep.png";
import "./PageLogo.css";

// 1페이지를 제외한 모든 페이지 상단에 공통으로 쓰는 작은 로고입니다.
// visible: 해당 페이지 본문이 나타나는 시점(같은 inView 값)을 그대로 받아
// 본문과 똑같은 속도로 함께 서서히 나타나도록 맞춥니다.
function PageLogo({ visible }) {
  return (
    <motion.img
      className="page-logo"
      src={starmoonsun}
      alt="별달해 독서클럽"
      initial={{ opacity: 0, x: "-50%", y: 20 }}
      animate={{ opacity: visible ? 1 : 0, x: "-50%", y: visible ? 0 : 20 }}
      transition={{ duration: visible ? 1.4 : 0.5, ease: "easeOut" }}
    />
  );
}

export default PageLogo;