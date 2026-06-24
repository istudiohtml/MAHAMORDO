"use client";

interface Props {
  id: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}

/** Accessible toggle switch for CMS boolean settings. */
export default function CmsSettingToggle({
  id,
  checked,
  disabled = false,
  onChange,
}: Props) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className="cms-settings-switch"
      onClick={() => onChange(!checked)}
    >
      <span
        className={`cms-settings-switch-track${checked ? " is-on" : ""}`}
        aria-hidden="true"
      >
        <span className="cms-settings-switch-thumb" />
      </span>
      <span
        className={`cms-settings-switch-status${checked ? " is-on" : " is-off"}`}
      >
        {checked ? "เปิดใช้งาน" : "ปิดอยู่"}
      </span>
    </button>
  );
}
