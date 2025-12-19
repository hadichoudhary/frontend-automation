import style from "../css/platformCard.module.css";

const PlatformCard = ({
  name,
  Icon,
  color,
  isConnected,
  username,
  onConnect,
  onDisconnect,
  children,
}) => {
  return (
    <div className={style.card}>
      <div className={style.left}>
        <div className={style.iconBox} style={{ backgroundColor: color }}>
          <Icon size={24} color="#fff" />
        </div>

        <div className={style.textBox}>
          <h3>{name}</h3>
          <p
            className={`${style.status} ${
              isConnected ? style.connected : style.disconnected
            }`}
          >
            <span className={style.dot}></span>
            {isConnected ? username : "Not Connected"}
          </p>
        </div>
      </div>

      <div className={style.right}>
        {!isConnected ? (
          children ? (
            children
          ) : (
            <button className={style.connectBtn} onClick={onConnect}>
              Connect
            </button>
          )
        ) : (
          <button
            className={style.disconnectBtn}
            onClick={onDisconnect}
          >
            Disconnect
          </button>
        )}
      </div>
    </div>
  );
};

export default PlatformCard;
