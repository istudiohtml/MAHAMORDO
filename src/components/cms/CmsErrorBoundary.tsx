"use client";

import React from "react";

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export default class CmsErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="cms-page">
          <p className="cms-posts-error">หน้านี้แสดงผลไม่สำเร็จ</p>
          <p className="cms-page-sub" style={{ marginTop: "0.5rem" }}>
            {this.state.error.message}
          </p>
          <button
            type="button"
            className="cms-btn cms-btn-ghost"
            style={{ marginTop: "1rem" }}
            onClick={() => {
              this.setState({ error: null });
              window.location.reload();
            }}
          >
            รีเฟรชหน้า
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
