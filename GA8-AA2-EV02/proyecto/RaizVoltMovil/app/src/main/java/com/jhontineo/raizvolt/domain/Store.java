package com.jhontineo.raizvolt.domain;

import java.util.List;

/** Puerto Repository. La implementación garantiza atomicidad y serialización de transacciones. */
public interface Store {
  interface Work<T> {
    T run();
  }

  <T> T transaction(Work<T> work);

  List<Product> products(String query);

  Product product(long id);

  long saveProduct(Product product);

  void setStock(long id, int stock, String reason);

  void archive(long id);

  Profile profile();

  void saveProfile(Profile profile);

  long saveQuote(Quote quote);

  Quote quote(long id);

  List<Quote> quotes();

  Order order(long id);

  Order orderForQuote(long id);

  long saveOrder(long quoteId, long time);

  void setStatus(long id, String status);

  List<Order> orders();
}
