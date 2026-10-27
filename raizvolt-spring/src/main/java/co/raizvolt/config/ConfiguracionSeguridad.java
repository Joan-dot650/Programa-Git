package co.raizvolt.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

/** Catálogo para un operador local. Conserva CSRF en todos los formularios POST. */
@Configuration
public class ConfiguracionSeguridad {
  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    return http
        .authorizeHttpRequests(reglas -> reglas.anyRequest().permitAll())
        .formLogin(AbstractHttpConfigurer::disable)
        .httpBasic(AbstractHttpConfigurer::disable)
        .logout(AbstractHttpConfigurer::disable)
        .headers(cabeceras -> cabeceras.contentSecurityPolicy(politica ->
            politica.policyDirectives("default-src 'self'; style-src 'self'; "
                + "img-src 'self'; form-action 'self'; frame-ancestors 'none'")))
        .build();
  }

  @Bean
  public UserDetailsService userDetailsService() {
    // No hay usuarios ni contraseñas de ejemplo; el alcance es únicamente local.
    return new InMemoryUserDetailsManager();
  }
}
