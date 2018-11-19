FROM mysql:5.6.35

RUN sed -i -e"s/^bind-address\s*=\s*127.0.0.1/bind-address = 0.0.0.0/" /etc/mysql/my.cnf
RUN echo "max_allowed_packet=500M" >> /etc/mysql/conf.d/docker.cnf
RUN echo "sql_mode=ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER" >> /etc/mysql/conf.d/docker.cnf
# RUN echo "show_compatibility_56=ON" >> /etc/mysql/conf.d/docker.cnf
RUN service mysql restart

EXPOSE 3306



