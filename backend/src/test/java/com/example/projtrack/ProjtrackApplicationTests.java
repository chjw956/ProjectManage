package com.example.projtrack;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class ProjtrackApplicationTests {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void contextLoads() {
    }

    /**
     * 기본 프로필(flyway.locations=classpath:db/migration)에서는
     * db/seed가 포함되지 않으므로 시드 데이터가 삽입되지 않아야 한다.
     */
    @Test
    void seedDataIsNotAppliedInDefaultProfile() {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM app_user", Integer.class);
        assertThat(count).isZero();
    }
}
