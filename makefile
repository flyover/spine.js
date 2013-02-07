#
# Copyright (c) 2013 Flyover Games, LLC 
#
# Isaac Burns isaacburns@gmail.com 
#  
# Permission is hereby granted, free of charge, to any person 
# obtaining a copy of this software and associated 
# documentation files (the "Software"), to deal in the Software 
# without restriction, including without limitation the rights 
# to use, copy, modify, merge, publish, distribute, sublicense, 
# and/or sell copies of the Software, and to permit persons to 
# whom the Software is furnished to do so, subject to the 
# following conditions: 
#  
# The above copyright notice and this permission notice shall 
# be included in all copies or substantial portions of the 
# Software. 
#  
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY 
# KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE 
# WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
# PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR 
# COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR 
# OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE 
# SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 
#

SHELL = /usr/bin/env bash

ANSI_NONE    = "\e[1;0m"
ANSI_BLACK   = "\e[1;30m"
ANSI_RED     = "\e[1;31m"
ANSI_GREEN   = "\e[1;32m"
ANSI_YELLOW  = "\e[1;33m"
ANSI_BLUE    = "\e[1;34m"
ANSI_MAGENTA = "\e[1;35m"
ANSI_CYAN    = "\e[1;36m"
ANSI_WHITE   = "\e[1;37m"

DONE = @printf "done: "$(ANSI_GREEN)"%s"$(ANSI_NONE)"\n" $@

CLOSURE_COMPILER_PATH = closure-compiler
CLOSURE_LIBRARY_PATH = closure-library

# closure depswriter needs the relative path from base.js in 
# $(CLOSURE_LIBRARY_PATH)/closure/goog to this makefile directory
CLOSURE_DEPSWRITER_PREFIX = $(shell python -c "import os.path; print os.path.relpath('.', '$(CLOSURE_LIBRARY_PATH)/closure/goog')")

all: help

help:
	@printf "Usage:\n"
	@printf "$$ make <"$(ANSI_YELLOW)"target"$(ANSI_NONE)">\n"
	@printf "target:\n"
	@printf " "$(ANSI_YELLOW)"sync"$(ANSI_NONE)"         : download and install tools\n"
	@printf " "$(ANSI_YELLOW)"server-start"$(ANSI_NONE)" : start local web server\n"
	@printf " "$(ANSI_YELLOW)"stop-server"$(ANSI_NONE)"  : stop local web server\n"
	@printf " "$(ANSI_YELLOW)"clean"$(ANSI_NONE)"        : clean all projects\n"
	@printf " "$(ANSI_YELLOW)"build"$(ANSI_NONE)"        : build all projects\n"
	@printf " "$(ANSI_YELLOW)"run"$(ANSI_NONE)"          : run all projects\n"
	@printf " "$(ANSI_YELLOW)"debug"$(ANSI_NONE)"        : debug all projects\n"
	@printf " "$(ANSI_BLUE)"spine-demo"$(ANSI_NONE)"\n"
	@printf " "$(ANSI_YELLOW)"spine-demo"$(ANSI_NONE)"       : build and run spine-demo project\n"
	@printf " "$(ANSI_YELLOW)"clean-spine-demo"$(ANSI_NONE)" : clean spine-demo project\n"
	@printf " "$(ANSI_YELLOW)"build-spine-demo"$(ANSI_NONE)" : build spine-demo project\n"
	@printf " "$(ANSI_YELLOW)"run-spine-demo"$(ANSI_NONE)"   : run spine-demo project\n"
	@printf " "$(ANSI_YELLOW)"debug-spine-demo"$(ANSI_NONE)" : debug spine-demo project\n"
	@printf " "$(ANSI_BLUE)"spine2spriter"$(ANSI_NONE)"\n"
	@printf " "$(ANSI_YELLOW)"spine2spriter"$(ANSI_NONE)" : build and run spine2spriter project\n"
	@printf " "$(ANSI_YELLOW)"clean-spine2spriter"$(ANSI_NONE)" : clean spine2spriter project\n"
	@printf " "$(ANSI_YELLOW)"build-spine2spriter"$(ANSI_NONE)" : build spine2spriter project\n"
	@printf " "$(ANSI_YELLOW)"run-spine2spriter"$(ANSI_NONE)"   : run spine2spriter project\n"
	@printf " "$(ANSI_YELLOW)"debug-spine2spriter"$(ANSI_NONE)" : debug spine2spriter project\n"

clean: clean-spine-demo
clean: clean-spine2spriter
clean:
	$(DONE)

build: build-spine-demo
build: build-spine2spriter
build:
	$(DONE)

run: run-spine-demo
run: run-spine2spriter
run:
	$(DONE)

debug: debug-spine-demo
debug: debug-spine2spriter
debug:
	$(DONE)

# sync

sync:
	$(MAKE) --no-print-directory sync-closure-compiler
	$(MAKE) --no-print-directory sync-closure-library
	$(MAKE) --no-print-directory sync-node-closure
	$(DONE)
	
# sync-closure-compiler	
	
sync-closure-compiler:
	$(SYNC_CLOSURE_COMPILER_COMMAND)
	$(DONE)

SYNC_CLOSURE_COMPILER_COMMAND += mkdir -p $(CLOSURE_COMPILER_PATH) ;
SYNC_CLOSURE_COMPILER_COMMAND += if [ -e $(CLOSURE_COMPILER_PATH)/compiler-latest.tar.gz ] ; then
SYNC_CLOSURE_COMPILER_COMMAND +=  curl http://closure-compiler.googlecode.com/files/compiler-latest.tar.gz 
SYNC_CLOSURE_COMPILER_COMMAND +=   -o $(CLOSURE_COMPILER_PATH)/compiler-latest.tar.gz
SYNC_CLOSURE_COMPILER_COMMAND +=   -z $(CLOSURE_COMPILER_PATH)/compiler-latest.tar.gz ;
SYNC_CLOSURE_COMPILER_COMMAND += else
SYNC_CLOSURE_COMPILER_COMMAND +=  curl http://closure-compiler.googlecode.com/files/compiler-latest.tar.gz 
SYNC_CLOSURE_COMPILER_COMMAND +=   -o $(CLOSURE_COMPILER_PATH)/compiler-latest.tar.gz ;
SYNC_CLOSURE_COMPILER_COMMAND += fi ;
SYNC_CLOSURE_COMPILER_COMMAND += tar -zxvf $(CLOSURE_COMPILER_PATH)/compiler-latest.tar.gz -C $(CLOSURE_COMPILER_PATH)/ ;

# sync-closure-library

sync-closure-library:
	$(SYNC_CLOSURE_LIBRARY_COMMAND)
	$(DONE)

SYNC_CLOSURE_LIBRARY_COMMAND += mkdir -p $(CLOSURE_LIBRARY_PATH) ;
SYNC_CLOSURE_LIBRARY_COMMAND += svn checkout http://closure-library.googlecode.com/svn/trunk/ $(CLOSURE_LIBRARY_PATH) ;

# sync-node-closure

sync-node-closure:
	npm install closure
	$(DONE)

# server

SERVER_PORT = 3000

start: server-start
server-start:
	@$(SERVER_START_COMMAND)
	$(DONE)

SERVER_START_COMMAND += if [ -e /usr/sbin/lighttpd ];
SERVER_START_COMMAND += then
SERVER_START_COMMAND +=  printf "start web server using: "$(ANSI_BLUE)"lighttpd"$(ANSI_NONE)" on port "$(SERVER_PORT)"\n";
SERVER_START_COMMAND +=  [ -e server.pid ] && ( cat server.pid | xargs -n1 kill ; rm -f server.pid ) || true;
SERVER_START_COMMAND +=  echo "server.document-root = \"$$(pwd)\"" > lighttpd.conf;
SERVER_START_COMMAND +=  echo "server.port = $(SERVER_PORT)" >> lighttpd.conf;
SERVER_START_COMMAND +=  echo "server.username = \"www\"" >> lighttpd.conf;
SERVER_START_COMMAND +=  echo "server.groupname = \"www\"" >> lighttpd.conf;
SERVER_START_COMMAND +=  echo "mimetype.assign = (" >> lighttpd.conf;
SERVER_START_COMMAND +=  echo " \".html\" => \"text/html\"," >> lighttpd.conf;
SERVER_START_COMMAND +=  echo " \".css\" => \"text/css\"," >> lighttpd.conf;
SERVER_START_COMMAND +=  echo " \".txt\" => \"text/plain\"," >> lighttpd.conf;
SERVER_START_COMMAND +=  echo " \".js\" => \"text/javascript\"," >> lighttpd.conf;
SERVER_START_COMMAND +=  echo " \".jpg\" => \"image/jpeg\"," >> lighttpd.conf;
SERVER_START_COMMAND +=  echo " \".gif\" => \"image/gif\"," >> lighttpd.conf;
SERVER_START_COMMAND +=  echo " \".png\" => \"image/png\"," >> lighttpd.conf;
SERVER_START_COMMAND +=  echo " \".ttf\" => \"application/x-font-ttf\"" >> lighttpd.conf;
SERVER_START_COMMAND +=  echo ")" >> lighttpd.conf;
SERVER_START_COMMAND +=  echo "static-file.exclude-extensions = ( \".fcgi\", \".php\", \".rb\", \"~\", \".inc\" )" >> lighttpd.conf;
SERVER_START_COMMAND +=  echo "index-file.names = ( \"index.html\" )" >> lighttpd.conf;
SERVER_START_COMMAND +=  echo "dir-listing.activate = \"enable\"" >> lighttpd.conf;
SERVER_START_COMMAND +=  ( /usr/sbin/lighttpd -D -f lighttpd.conf & echo $$! > server.pid );
SERVER_START_COMMAND +=  sleep 1;
SERVER_START_COMMAND += else
SERVER_START_COMMAND +=  printf "start web server using "$(ANSI_BLUE)"python SimpleHTTPServer"$(ANSI_NONE)" on port "$(SERVER_PORT)"\n";
SERVER_START_COMMAND +=  [ ! -e server.pid ] && ( python -m SimpleHTTPServer $(SERVER_PORT) & echo $$! > server.pid ) || true;
SERVER_START_COMMAND +=  sleep 1;
SERVER_START_COMMAND += fi

stop: server-stop
server-stop:
	@$(SERVER_STOP_COMMAND)
	$(DONE)

SERVER_STOP_COMMAND += if [ -e /usr/sbin/lighttpd ];
SERVER_STOP_COMMAND += then
SERVER_STOP_COMMAND +=  printf "stop web server using: "$(ANSI_BLUE)"lighttpd"$(ANSI_NONE)" on port "$(SERVER_PORT)"\n";
SERVER_STOP_COMMAND +=  [ -e server.pid ] && ( cat server.pid | xargs -n1 kill ; rm -f server.pid ) || true;
SERVER_STOP_COMMAND += else
SERVER_STOP_COMMAND +=  printf "stop web server using "$(ANSI_BLUE)"python SimpleHTTPServer"$(ANSI_NONE)" on port "$(SERVER_PORT)"\n";
SERVER_STOP_COMMAND +=  [ -e server.pid ] && ( cat server.pid | xargs -n1 kill ; rm -f server.pid ) || true;
SERVER_STOP_COMMAND += fi;

# spine-demo

spine-demo:
	$(MAKE) --no-print-directory sync
	$(MAKE) --no-print-directory build-spine-demo
	$(MAKE) --no-print-directory server-start
	$(MAKE) --no-print-directory run-spine-demo
	$(DONE)

clean-spine-demo: clean-spine-demo-js-deps
clean-spine-demo: clean-spine-demo-js-output
clean-spine-demo:
	$(DONE)

build-spine-demo: build-spine-demo-js-deps
build-spine-demo: build-spine-demo-js-output
build-spine-demo:
	$(DONE)

# spine-demo-js

SPINE_DEMO_JS_SOURCE_FILES += spine-demo-main.js
SPINE_DEMO_JS_SOURCE_FILES += spine.js
SPINE_DEMO_JS_SOURCE_FILES += flyover.js
SPINE_DEMO_JS_SOURCE_FILES += jsonxml/json2xml.js

SPINE_DEMO_JS_SOURCE_PATHS += $(CLOSURE_LIBRARY_PATH)/third_party/closure/goog
SPINE_DEMO_JS_SOURCE_PATHS += $(CLOSURE_LIBRARY_PATH)/closure/goog

# spine-demo-js-deps

SPINE_DEMO_JS_DEPS_OUTPUT_FILE = spine-demo-deps.js

clean-spine-demo-js-deps:
	rm -fv $(SPINE_DEMO_JS_DEPS_OUTPUT_FILE)
	$(DONE)

build-spine-demo-js-deps:
	$(SPINE_DEMO_JS_DEPS_COMMAND)
	$(DONE)

SPINE_DEMO_JS_DEPS_COMMAND += $(CLOSURE_LIBRARY_PATH)/closure/bin/build/depswriter.py
SPINE_DEMO_JS_DEPS_COMMAND += $(foreach file,$(SPINE_DEMO_JS_SOURCE_FILES),--path_with_depspath="$(file) $(CLOSURE_DEPSWRITER_PREFIX)/$(file)")
SPINE_DEMO_JS_DEPS_COMMAND += $(foreach path,$(SPINE_DEMO_JS_SOURCE_PATHS),--root_with_prefix="$(path) $(CLOSURE_DEPSWRITER_PREFIX)/$(path)")
SPINE_DEMO_JS_DEPS_COMMAND += > $(SPINE_DEMO_JS_DEPS_OUTPUT_FILE)

# spine-demo-js-output

SPINE_DEMO_JS_OUTPUT_NAMESPACE = "main.start"
SPINE_DEMO_JS_OUTPUT_FILE = spine-demo-compiled.js

clean-spine-demo-js-output:
	rm -f $(SPINE_DEMO_JS_OUTPUT_FILE)
	$(DONE)

build-spine-demo-js-output: build-spine-demo-js-deps
build-spine-demo-js-output:
	$(SPINE_DEMO_JS_OUTPUT_COMMAND)
	$(DONE)

SPINE_DEMO_JS_OUTPUT_COMMAND += $(CLOSURE_LIBRARY_PATH)/closure/bin/build/closurebuilder.py
SPINE_DEMO_JS_OUTPUT_COMMAND += --namespace=$(SPINE_DEMO_JS_OUTPUT_NAMESPACE)
SPINE_DEMO_JS_OUTPUT_COMMAND += $(SPINE_DEMO_JS_SOURCE_FILES)
SPINE_DEMO_JS_OUTPUT_COMMAND += $(patsubst %,--root=%,$(SPINE_DEMO_JS_SOURCE_PATHS))
SPINE_DEMO_JS_OUTPUT_COMMAND += --output_mode=compiled
SPINE_DEMO_JS_OUTPUT_COMMAND += --compiler_jar=$(CLOSURE_COMPILER_PATH)/compiler.jar
SPINE_DEMO_JS_OUTPUT_COMMAND += $(SPINE_DEMO_JS_COMPILER_FLAGS)
SPINE_DEMO_JS_OUTPUT_COMMAND += --output_file=$(SPINE_DEMO_JS_OUTPUT_FILE)

SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--generate_exports"

#SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--compilation_level=WHITESPACE_ONLY"
SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--compilation_level=SIMPLE_OPTIMIZATIONS"
#SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--compilation_level=ADVANCED_OPTIMIZATIONS"

SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--define=goog.DEBUG=false"

SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=accessControls"
SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=ambiguousFunctionDecl"
SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=checkRegExp"
SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=checkTypes"
SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=checkVars"
SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=constantProperty"
SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=deprecated"
SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=es5Strict"
SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=externsValidation"
SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=fileoverviewTags"
SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=globalThis"
SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=internetExplorerChecks"
SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=invalidCasts"
SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=missingProperties"
SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=nonStandardJsDocs"
SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=strictModuleDepCheck"
SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=typeInvalidation"
SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=undefinedVars"
SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=unknownDefines"
SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=uselessCode"
SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=visibility"

# debug-spine-demo

RUN_SPINE_DEMO_URL = http://localhost:$(SERVER_PORT)/index.html

run-spine-demo:
	if [[ "$${OSTYPE}" == "cygwin" ]]; then cygstart $(RUN_SPINE_DEMO_URL); fi
	if [[ "$${OSTYPE}" == "darwin"* ]]; then open $(RUN_SPINE_DEMO_URL); fi
	if [[ "$${OSTYPE}" == "linux"* ]]; then xdg-open $(RUN_SPINE_DEMO_URL); fi
	$(DONE)

# debug-spine-demo

DEBUG_SPINE_DEMO_URL = http://localhost:$(SERVER_PORT)/index-debug.html

debug-spine-demo:
	if [[ "$${OSTYPE}" == "cygwin" ]]; then cygstart $(DEBUG_SPINE_DEMO_URL); fi
	if [[ "$${OSTYPE}" == "darwin"* ]]; then open $(DEBUG_SPINE_DEMO_URL); fi
	if [[ "$${OSTYPE}" == "linux"* ]]; then xdg-open $(DEBUG_SPINE_DEMO_URL); fi
	$(DONE)

# spine2spriter

spine2spriter:
	$(MAKE) --no-print-directory sync
	$(MAKE) --no-print-directory build-spine2spriter
	$(MAKE) --no-print-directory run-spine2spriter
	$(DONE)

clean-spine2spriter: clean-spine2spriter-js-deps
clean-spine2spriter: clean-spine2spriter-js-output
clean-spine2spriter:
	$(DONE)

build-spine2spriter: build-spine2spriter-js-deps
build-spine2spriter: build-spine2spriter-js-output
build-spine2spriter:
	$(DONE)

# spine2spriter-js

SPINE2SPRITER_JS_SOURCE_FILES += spine.js
SPINE2SPRITER_JS_SOURCE_FILES += flyover.js
SPINE2SPRITER_JS_SOURCE_FILES += jsonxml/json2xml.js

SPINE2SPRITER_JS_SOURCE_PATHS += $(CLOSURE_LIBRARY_PATH)/third_party/closure/goog
SPINE2SPRITER_JS_SOURCE_PATHS += $(CLOSURE_LIBRARY_PATH)/closure/goog

# spine2spriter-js-deps

SPINE2SPRITER_JS_DEPS_OUTPUT_FILE = spine2spriter-deps.js

clean-spine2spriter-js-deps:
	rm -fv $(SPINE2SPRITER_JS_DEPS_OUTPUT_FILE)
	$(DONE)

build-spine2spriter-js-deps:
	$(SPINE2SPRITER_JS_DEPS_COMMAND)
	$(DONE)

SPINE2SPRITER_JS_DEPS_COMMAND += $(CLOSURE_LIBRARY_PATH)/closure/bin/build/depswriter.py
SPINE2SPRITER_JS_DEPS_COMMAND += $(foreach file,$(SPINE2SPRITER_JS_SOURCE_FILES),--path_with_depspath="$(file) $(CLOSURE_DEPSWRITER_PREFIX)/$(file)")
SPINE2SPRITER_JS_DEPS_COMMAND += $(foreach path,$(SPINE2SPRITER_JS_SOURCE_PATHS),--root_with_prefix="$(path) $(CLOSURE_DEPSWRITER_PREFIX)/$(path)")
SPINE2SPRITER_JS_DEPS_COMMAND += > $(SPINE2SPRITER_JS_DEPS_OUTPUT_FILE)

# spine2spriter-js-output

SPINE2SPRITER_JS_OUTPUT_NAMESPACE = "spine"
SPINE2SPRITER_JS_OUTPUT_FILE = spine2spriter-compiled.js

clean-spine2spriter-js-output:
	rm -f $(SPINE2SPRITER_JS_OUTPUT_FILE)
	$(DONE)

build-spine2spriter-js-output: build-spine2spriter-js-deps
build-spine2spriter-js-output:
	$(SPINE2SPRITER_JS_OUTPUT_COMMAND)
	$(DONE)

SPINE2SPRITER_JS_OUTPUT_COMMAND += $(CLOSURE_LIBRARY_PATH)/closure/bin/build/closurebuilder.py
SPINE2SPRITER_JS_OUTPUT_COMMAND += --namespace=$(SPINE2SPRITER_JS_OUTPUT_NAMESPACE)
SPINE2SPRITER_JS_OUTPUT_COMMAND += $(SPINE2SPRITER_JS_SOURCE_FILES)
SPINE2SPRITER_JS_OUTPUT_COMMAND += $(patsubst %,--root=%,$(SPINE2SPRITER_JS_SOURCE_PATHS))
SPINE2SPRITER_JS_OUTPUT_COMMAND += --output_mode=compiled
SPINE2SPRITER_JS_OUTPUT_COMMAND += --compiler_jar=$(CLOSURE_COMPILER_PATH)/compiler.jar
SPINE2SPRITER_JS_OUTPUT_COMMAND += $(SPINE2SPRITER_JS_COMPILER_FLAGS)
SPINE2SPRITER_JS_OUTPUT_COMMAND += --output_file=$(SPINE2SPRITER_JS_OUTPUT_FILE)

SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--generate_exports"

#SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--compilation_level=WHITESPACE_ONLY"
SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--compilation_level=SIMPLE_OPTIMIZATIONS"
#SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--compilation_level=ADVANCED_OPTIMIZATIONS"

SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--define=goog.DEBUG=false"

SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=accessControls"
SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=ambiguousFunctionDecl"
SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=checkRegExp"
SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=checkTypes"
SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=checkVars"
SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=constantProperty"
SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=deprecated"
SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=es5Strict"
SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=externsValidation"
SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=fileoverviewTags"
SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=globalThis"
SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=internetExplorerChecks"
SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=invalidCasts"
SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=missingProperties"
SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=nonStandardJsDocs"
SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=strictModuleDepCheck"
SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=typeInvalidation"
SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=undefinedVars"
SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=unknownDefines"
SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=uselessCode"
SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=visibility"

# debug-spine2spriter

run-spine2spriter:
	node spine2spriter.js
	$(DONE)

# debug-spine2spriter

debug-spine2spriter:
	@printf $(ANSI_CYAN)"TODO"$(ANSI_NONE)": debug spine2spriter using node inspector\n"
	$(DONE)

