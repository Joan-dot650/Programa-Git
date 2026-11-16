package com.jhontineo.raizvolt.ui;

import android.content.Context;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.view.*;
import android.widget.*;

/** Campos, tarjetas y botones compartidos por todos los módulos. */
public final class Ui {
  public static final int GREEN = 0xff174f3c, INK = 0xff17362b, MUTED = 0xff58685f, BG = 0xfff3f5ef;
  private final Context context;

  public Ui(Context context) {
    this.context = context;
  }

  public int dp(int value) {
    return Math.round(value * context.getResources().getDisplayMetrics().density);
  }

  public LinearLayout column() {
    LinearLayout l = new LinearLayout(context);
    l.setOrientation(LinearLayout.VERTICAL);
    return l;
  }

  public LinearLayout row() {
    LinearLayout l = new LinearLayout(context);
    l.setOrientation(LinearLayout.HORIZONTAL);
    l.setGravity(Gravity.CENTER_VERTICAL);
    return l;
  }

  public TextView text(String value, int size, int color, boolean bold) {
    TextView t = new TextView(context);
    t.setText(value);
    t.setTextSize(size);
    t.setTextColor(color);
    if (bold) t.setTypeface(null, Typeface.BOLD);
    t.setPadding(0, dp(4), 0, dp(4));
    return t;
  }

  public LinearLayout card() {
    LinearLayout c = column();
    c.setPadding(dp(16), dp(12), dp(16), dp(12));
    GradientDrawable bg = new GradientDrawable();
    bg.setColor(0xffffffff);
    bg.setCornerRadius(dp(16));
    bg.setStroke(dp(1), 0xffdfe5d9);
    c.setBackground(bg);
    LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(-1, -2);
    p.setMargins(0, 0, 0, dp(12));
    c.setLayoutParams(p);
    return c;
  }

  public Button button(String label, String tag, Runnable action) {
    Button b = new Button(context);
    b.setText(label);
    b.setTag(tag);
    b.setAllCaps(false);
    b.setTextSize(14);
    b.setTextColor(GREEN);
    b.setMinHeight(dp(48));
    b.setOnClickListener(v -> action.run());
    return b;
  }

  public Button primary(String label, String tag, Runnable action) {
    Button b = button(label, tag, action);
    b.setTextColor(0xffffffff);
    b.setBackgroundTintList(android.content.res.ColorStateList.valueOf(GREEN));
    return b;
  }

  public EditText field(
      LinearLayout container, String label, String value, String tag, int type, int max) {
    TextView title = text(label, 13, MUTED, true);
    container.addView(title);
    EditText e = new EditText(context);
    e.setId(View.generateViewId());
    title.setLabelFor(e.getId());
    e.setTag(tag);
    e.setText(value);
    e.setTextSize(16);
    e.setSingleLine(true);
    e.setInputType(type);
    e.setFilters(new android.text.InputFilter[] {new android.text.InputFilter.LengthFilter(max)});
    e.setMinHeight(dp(48));
    container.addView(e, new LinearLayout.LayoutParams(-1, -2));
    return e;
  }

  public void weighted(LinearLayout row, View view) {
    row.addView(view, new LinearLayout.LayoutParams(0, -2, 1));
  }
}
