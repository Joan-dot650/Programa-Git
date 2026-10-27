package co.raizvolt.config;

import co.raizvolt.dao.ProductoDao;
import co.raizvolt.servicio.ProductoServicio;
import java.util.Locale;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.i18n.FixedLocaleResolver;

/** Registra el servicio heredado sin acoplar sus reglas de negocio a Spring. */
@Configuration
public class ConfiguracionAplicacion {
  @Bean
  public ProductoServicio productoServicio(ProductoDao productoDao) {
    return new ProductoServicio(productoDao);
  }

  @Bean
  public LocaleResolver localeResolver() {
    return new FixedLocaleResolver(Locale.forLanguageTag("es-CO"));
  }
}
