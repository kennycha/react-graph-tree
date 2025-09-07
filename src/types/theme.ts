export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    backgroundSecondary: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;

    detector: string;
    tracker: string;
    ga: string;
    sf: string;
    event: string;

    connection: string;
    connectionActive: string;
    connectionError: string;
  };

  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };

  fonts: {
    body: string;
    heading: string;
  };

  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };

  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

export const defaultTheme: Theme = {
  colors: {
    primary: "#6366f1",
    secondary: "#8b5cf6",
    background: "#1e1e1e",
    backgroundSecondary: "#3a3a3a",
    surface: "#2d2d2d",
    text: "#ffffff",
    textSecondary: "#a1a1aa",
    border: "#404040",
    error: "#ef4444",
    success: "#22c55e",
    warning: "#f59e0b",

    detector: "#3b82f6",
    tracker: "#10b981",
    ga: "#f59e0b",
    sf: "#8b5cf6",
    event: "#ef4444",

    connection: "#6b7280",
    connectionActive: "#06b6d4",
    connectionError: "#ef4444",
  },

  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },

  fonts: {
    body: "system-ui, -apple-system, sans-serif",
    heading: "system-ui, -apple-system, sans-serif",
  },

  borderRadius: {
    sm: "4px",
    md: "8px",
    lg: "12px",
  },

  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px rgba(0, 0, 0, 0.1)",
  },
};
