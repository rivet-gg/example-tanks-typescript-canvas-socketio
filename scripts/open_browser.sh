#!/bin/sh

google-chrome \
	--ignore-certificate-errors-spki-list=gXcw0H9fTm7BmZwr9Tslb9rchTFnK1CG5eCnipy5q1o= \
	--ignore-certificate-errors \
	--v=2 \
	--enable-logging=stderr \
	--origin-to-force-quic-on=127.0.0.1:3000 \
	https://127.0.0.1:8080/
