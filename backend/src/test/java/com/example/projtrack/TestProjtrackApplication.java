package com.example.projtrack;

import org.springframework.boot.SpringApplication;

public class TestProjtrackApplication {

	public static void main(String[] args) {
		SpringApplication.from(ProjtrackApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
