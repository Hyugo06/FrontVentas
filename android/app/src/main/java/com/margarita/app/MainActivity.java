package com.margarita.app;
import com.getcapacitor.BridgeActivity;
import android.os.Bundle; // <--- 1. Importar
import android.graphics.Color; // <--- 2. Importar

public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    getWindow().setNavigationBarColor(Color.BLACK);

    android.view.View decorView = getWindow().getDecorView();
    int flags = decorView.getSystemUiVisibility();
    flags &= ~android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
    decorView.setSystemUiVisibility(flags);
  }
}
