#
# Copyright (c) Flyover Games, LLC 
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

__default__: help

OSTYPE := $(shell echo $${OSTYPE})

# trace
T ?= $(if $(findstring trace,$(MAKECMDGOALS)),1)

# debug
D ?= $(if $(findstring debug,$(MAKECMDGOALS)),1)

# verbose
V ?= $(if $(findstring verbose,$(MAKECMDGOALS)),1)

COLOR ?= $(if $(V),,true)

ANSI_NONE	:= $(if $(COLOR),\033[1;0m)
ANSI_BLACK	:= $(if $(COLOR),\033[1;30m)
ANSI_RED	:= $(if $(COLOR),\033[1;31m)
ANSI_GREEN	:= $(if $(COLOR),\033[1;32m)
ANSI_YELLOW	:= $(if $(COLOR),\033[1;33m)
ANSI_BLUE	:= $(if $(COLOR),\033[1;34m)
ANSI_MAGENTA	:= $(if $(COLOR),\033[1;35m)
ANSI_CYAN	:= $(if $(COLOR),\033[1;36m)
ANSI_WHITE	:= $(if $(COLOR),\033[1;37m)

HOST_SYSTEM = unknown
HOST_SUDO = echo HOST_SUDO $1
HOST_OPEN = echo HOST_OPEN $1
HOST_KILL = echo HOST_KILL $1
HOST_BROWSE = echo HOST_BROWSE $1
HOST_CONVERT = echo HOST_CONVERT $1
HOST_POTRACE = echo HOST_POTRACE $1
HOST_CRUNCH = echo HOST_CRUNCH $1

# linux (Ubuntu)
ifneq (,$(findstring linux,$(OSTYPE)))
  HOST_IS_LINUX = true
  HOST_SYSTEM = linux-x86_64
  HOST_SUDO = sudo $1
  HOST_OPEN = echo OPEN $1
  HOST_KILL = kill $1
  HOST_BROWSE = ( google-chrome $1 & )
  HOST_CONVERT = convert
  HOST_POTRACE = potrace
  HOST_CRUNCH = crunch
endif

# darwin (OS X)
ifneq (,$(findstring darwin,$(OSTYPE)))
  HOST_IS_DARWIN = true
  HOST_SYSTEM = darwin-x86_64
  HOST_SUDO = sudo $1
  HOST_OPEN = open $1
  HOST_KILL = kill $1
  HOST_BROWSE = ( $(call HOST_OPEN,$1) & )
  HOST_CONVERT = convert
  HOST_POTRACE = ~/potrace-1.11.mac-univ/potrace
  HOST_CRUNCH = crunch
endif

# cygwin (Windows)
ifneq (,$(findstring cygwin,$(OSTYPE)))
  HOST_IS_CYGWIN = true
  HOST_SYSTEM = windows-x86_64
  HOST_SUDO = $1
  HOST_OPEN = cygstart $1
  HOST_KILL = taskkill /F /T /PID $$( ps -a | awk '{ if ($$1 == pid) { print $$4 } }' pid=$(strip $1) )
  HOST_BROWSE = ( $(call HOST_OPEN,$1) & )
  HOST_CONVERT = convert
  HOST_POTRACE = ~/bin/potrace-1.11.win64/potrace.exe
  HOST_CRUNCH = ~/bin/crunch_v101_r1/bin/crunch_x64.exe
endif

# Release, Debug
BUILDTYPE = $(if $(D),Debug,Release)

# $1: rule
# $2=: message
NOTE = printf "$(ANSI_NONE)note$(ANSI_NONE): $(ANSI_GREEN)%s$(ANSI_NONE)$(if $2, $(ANSI_CYAN)%s$(ANSI_NONE))\n" $1 $2

# $1: rule
# $2=: message
DONE = printf "$(ANSI_NONE)done$(ANSI_NONE): $(ANSI_GREEN)%s$(ANSI_NONE)$(if $2, $(ANSI_MAGENTA)%s$(ANSI_NONE))\n" $1 $2

# $1: rule
# $2=: message
TODO = printf "$(ANSI_NONE)todo$(ANSI_NONE): $(ANSI_GREEN)%s$(ANSI_NONE)$(if $2, $(ANSI_YELLOW)%s$(ANSI_NONE))\n" $1 $2

# $1: rule
# $2=: message
FAIL = printf "$(ANSI_NONE)fail$(ANSI_NONE): $(ANSI_GREEN)%s$(ANSI_NONE)$(if $2, $(ANSI_RED)%s$(ANSI_NONE))\n" $1 $2

# $1: name
# $2=: message
HAVE = $$( hash $1 2>/dev/null ) || ( $(call FAIL,"need \"$1\"",$2) && false )

# $1: output directory
# $2: git url
GIT_CLONE = [ -d $1/.git ] || (git clone $2 $1)

# $1: output directory
# $2: git url
GIT_LATEST = [ -d $1/.git ] && (cd $1 && git pull --recurse-submodules) || (git clone $2 $1 --recurse-submodules)

# $1: output directory
# $2: tag
GIT_CHECKOUT = [ -d $1/.git ] && (cd $1 && git checkout $2)

# $1: output file
# $2: url
CURL_LATEST = [ -e $1 ] && (curl -o $1 -z $1 $2) || (curl -o $1 $2)

# $1: label
SCRIPT_INIT = $(if $(T),$(call NOTE,$1,"script init"),true)

# $1: label
# $2=: code
SCRIPT_EXIT = $(if $(T),$(call NOTE,$1,"script exit"),true) && exit $(or $2,0)

# $1: label
# $2: script
SCRIPT_RUN = $(if $(V),,@) $(if $(T),$(call NOTE,$1,"script run"),true) && ( $2 ) && $(call DONE,$1)

TRACE_PRINT = $(if $(T),$(warning $1))

TRACE_PRINT_MAKE_VARIABLES += $(call TRACE_PRINT,MAKECMDGOALS: "$(MAKECMDGOALS)")
TRACE_PRINT_MAKE_VARIABLES += $(call TRACE_PRINT,MAKEFILE_LIST: "$(MAKEFILE_LIST)")
TRACE_PRINT_MAKE_VARIABLES += $(call TRACE_PRINT,MAKELEVEL: "$(MAKELEVEL)")

TRACE_PRINT_GOAL_VARIABLES += $(call TRACE_PRINT,KEYWORD_GOALS: "$(KEYWORD_GOALS)")
TRACE_PRINT_GOAL_VARIABLES += $(call TRACE_PRINT,COMMAND_GOALS: "$(COMMAND_GOALS)")
TRACE_PRINT_GOAL_VARIABLES += $(call TRACE_PRINT,PROJECT_GOALS: "$(PROJECT_GOALS)")
TRACE_PRINT_GOAL_VARIABLES += $(call TRACE_PRINT,MACHINE_GOALS: "$(MACHINE_GOALS)")
TRACE_PRINT_GOAL_VARIABLES += $(call TRACE_PRINT,OTHER_GOALS: "$(OTHER_GOALS)")

KEYWORD_GOALS = $(filter $(KEYWORDS),$(MAKECMDGOALS))
COMMAND_GOALS = $(filter $(COMMANDS),$(MAKECMDGOALS))
PROJECT_GOALS = $(if $(filter projects,$(KEYWORD_GOALS)),$(PROJECTS),$(filter $(PROJECTS),$(MAKECMDGOALS)))
MACHINE_GOALS = $(if $(filter machines,$(KEYWORD_GOALS)),$(MACHINES),$(filter $(MACHINES),$(MAKECMDGOALS)))
OTHER_GOALS = $(filter-out $(KEYWORDS) $(COMMANDS) $(PROJECTS) $(MACHINES),$(MAKECMDGOALS))

# keywords
KEYWORDS += and on for all trace debug verbose commands projects machines

# commands
COMMANDS += help reset setup clean build stop run

__help__:
	@printf "usage:\n"
	@printf "$$ make <$(ANSI_YELLOW)command$(ANSI_NONE)>-<$(ANSI_YELLOW)project$(ANSI_NONE)>\n"
	@printf "command:\n"
	@printf " $(ANSI_YELLOW)help$(ANSI_NONE)\n"
	@printf " $(ANSI_YELLOW)reset$(ANSI_NONE)\n"
	@printf " $(ANSI_YELLOW)setup$(ANSI_NONE)\n"
	@printf " $(ANSI_YELLOW)clean$(ANSI_NONE)\n"
	@printf " $(ANSI_YELLOW)build$(ANSI_NONE)\n"
	@printf " $(ANSI_YELLOW)stop$(ANSI_NONE)\n"
	@printf " $(ANSI_YELLOW)run$(ANSI_NONE)\n"
	@printf "project:\n"
	@for PROJECT in $(PROJECTS); do printf " $(ANSI_YELLOW)$${PROJECT}$(ANSI_NONE)\n"; done

DEFAULT_COMMAND = help

$(DEFAULT_COMMAND)-%: ; @ $(call TODO,$@)

DEFAULT_PROJECT = default

default-help:__help__;@true
default-%: ; @ $(call DONE,$*)

# setup-have

setup-have-git:			; @ $(call HAVE,git,"install")				&& $(call DONE,$@)
setup-have-curl:		; @ $(call HAVE,curl,"install")				&& $(call DONE,$@)
setup-have-python:		; @ $(call HAVE,python,"install")			&& $(call DONE,$@)
setup-have-java:		; @ $(call HAVE,java,"install from java.com")		&& $(call DONE,$@)
setup-have-ant:			; @ $(call HAVE,ant,"install from ant.apache.org")	&& $(call DONE,$@)
setup-have-node:		; @ $(call HAVE,node,"install from nodejs.org")		&& $(call DONE,$@)
setup-have-npm:			; @ $(call HAVE,npm,"install from nodejs.org")		&& $(call DONE,$@)
setup-have-node-inspector:	; @ $(call HAVE,node-inspector,"install using npm")	&& $(call DONE,$@)
setup-have-cordova:		; @ $(call HAVE,cordova,"install using npm")		&& $(call DONE,$@)

# google

default-setup: google-setup

GOOGLE_PATH = .

GOOGLE_CLOSURE_COMPILER_URL ?= https://github.com/google/closure-compiler.git
GOOGLE_CLOSURE_COMPILER_REVISION ?=

GOOGLE_CLOSURE_LIBRARY_URL ?= https://github.com/google/closure-library.git
GOOGLE_CLOSURE_LIBRARY_REVISION ?=

# $(GOOGLE_PATH)/closure-library/closure/bin/build/depswriter.py --help

# $(call GOOGLE_DEPSWRITER_SCRIPT, foo/path1 foo/path2, foo/file1.js foo/file2.js, foo.dep.js)
# $1: SOURCE_JS_PATHS
# $2: SOURCE_JS_FILES
# $3: OUTPUT_DEP_JS_FILE
# depswriter needs the relative path from base.js to working directory
GOOGLE_DEPSWRITER_SCRIPT = true
#GOOGLE_DEPSWRITER_SCRIPT += && export PREFIX=$$(python -c "import os.path; print os.path.relpath('.', '$(GOOGLE_PATH)/closure-library/closure/goog');")
#GOOGLE_DEPSWRITER_SCRIPT += && export PREFIX=$$(node -e "var path = require('path'); console.log(path.relative('$(GOOGLE_PATH)/closure-library/closure/goog', '.').split(path.sep).join('/'));")
GOOGLE_DEPSWRITER_SCRIPT += && export PREFIX=$$(node -p "var path = require('path'); path.relative('$(GOOGLE_PATH)/closure-library/closure/goog', '.').split(path.sep).join('/');")
GOOGLE_DEPSWRITER_SCRIPT += && python $(GOOGLE_PATH)/closure-library/closure/bin/build/depswriter.py
GOOGLE_DEPSWRITER_SCRIPT += $(foreach path,$1,--root_with_prefix="$(path) $${PREFIX}/$(path)")
GOOGLE_DEPSWRITER_SCRIPT += $(foreach file,$2,--path_with_depspath="$(file) $${PREFIX}/$(file)")
GOOGLE_DEPSWRITER_SCRIPT += > $3

GOOGLE_DEPSWRITER_DEPS += $(GOOGLE_PATH)/closure-library/closure/bin/build/depswriter.py

# $(GOOGLE_PATH)/closure-library/closure/bin/build/closurebuilder.py --help
# java -jar $(GOOGLE_PATH)/closure-compiler/build/compiler.jar --help

GOOGLE_COMPILER_FLAGS += --generate_exports
# --language_in: ECMASCRIPT3 | ECMASCRIPT5 | ECMASCRIPT5_STRICT
GOOGLE_COMPILER_FLAGS += --language_in=ECMASCRIPT5
# --compilation-level: WHITESPACE_ONLY | SIMPLE | ADVANCED
GOOGLE_COMPILER_FLAGS += --compilation_level=SIMPLE
GOOGLE_COMPILER_FLAGS += --define=goog.DEBUG=false
GOOGLE_COMPILER_FLAGS += --jscomp_error=accessControls
GOOGLE_COMPILER_FLAGS += --jscomp_error=ambiguousFunctionDecl
GOOGLE_COMPILER_FLAGS += --jscomp_error=checkEventfulObjectDisposal
GOOGLE_COMPILER_FLAGS += --jscomp_error=checkRegExp
GOOGLE_COMPILER_FLAGS += --jscomp_error=checkTypes
GOOGLE_COMPILER_FLAGS += --jscomp_error=checkStructDictInheritance
GOOGLE_COMPILER_FLAGS += --jscomp_error=checkVars
GOOGLE_COMPILER_FLAGS += --jscomp_error=const
GOOGLE_COMPILER_FLAGS += --jscomp_error=constantProperty
GOOGLE_COMPILER_FLAGS += --jscomp_error=deprecated
GOOGLE_COMPILER_FLAGS += --jscomp_error=duplicateMessage
GOOGLE_COMPILER_FLAGS += --jscomp_error=es3
GOOGLE_COMPILER_FLAGS += --jscomp_error=es5Strict
GOOGLE_COMPILER_FLAGS += --jscomp_error=externsValidation
GOOGLE_COMPILER_FLAGS += --jscomp_error=fileoverviewTags
GOOGLE_COMPILER_FLAGS += --jscomp_error=globalThis
GOOGLE_COMPILER_FLAGS += --jscomp_error=internetExplorerChecks
GOOGLE_COMPILER_FLAGS += --jscomp_error=invalidCasts
GOOGLE_COMPILER_FLAGS += --jscomp_error=misplacedTypeAnnotation
GOOGLE_COMPILER_FLAGS += --jscomp_error=missingGetCssName
GOOGLE_COMPILER_FLAGS += --jscomp_error=missingProperties
GOOGLE_COMPILER_FLAGS += --jscomp_error=missingProvide
GOOGLE_COMPILER_FLAGS += --jscomp_error=missingRequire
GOOGLE_COMPILER_FLAGS += --jscomp_error=missingReturn
GOOGLE_COMPILER_FLAGS += --jscomp_error=newCheckTypes
GOOGLE_COMPILER_FLAGS += --jscomp_error=nonStandardJsDocs
#GOOGLE_COMPILER_FLAGS += --jscomp_error=reportUnknownTypes
GOOGLE_COMPILER_FLAGS += --jscomp_error=strictModuleDepCheck
GOOGLE_COMPILER_FLAGS += --jscomp_error=suspiciousCode
GOOGLE_COMPILER_FLAGS += --jscomp_error=typeInvalidation
GOOGLE_COMPILER_FLAGS += --jscomp_error=undefinedNames
GOOGLE_COMPILER_FLAGS += --jscomp_error=undefinedVars
GOOGLE_COMPILER_FLAGS += --jscomp_error=unknownDefines
GOOGLE_COMPILER_FLAGS += --jscomp_error=uselessCode
#GOOGLE_COMPILER_FLAGS += --jscomp_error=useOfGoogBase
GOOGLE_COMPILER_FLAGS += --jscomp_error=visibility

# mute any output with 'closurebuilder.py'
GOOGLE_CLOSUREBUILDER_MUTE = 2>&1 | (grep -v 'closurebuilder.py' || true)

# $(call GOOGLE_CLOSUREBUILDER_SCRIPT, "foo", foo/path1 foo/path2, foo/file1.js foo/file2.js, foo/file.ext.js, foo.map.js, foo.min.js)
# $1: OUTPUT_NAMESPACE
# $2: SOURCE_JS_PATHS
# $3: SOURCE_JS_FILES
# $4: SOURCE_EXT_JS_FILES
# $5: OUTPUT_MAP_JS_FILE
# $6: OUTPUT_MIN_JS_FILE
#GOOGLE_CLOSUREBUILDER_SCRIPT = python $(GOOGLE_PATH)/closure-library/closure/bin/build/closurebuilder.py
#GOOGLE_CLOSUREBUILDER_SCRIPT += --namespace=$(strip $1)
#GOOGLE_CLOSUREBUILDER_SCRIPT += $(patsubst %,--root=%,$(strip $2))
#GOOGLE_CLOSUREBUILDER_SCRIPT += $3
#GOOGLE_CLOSUREBUILDER_SCRIPT += --output_mode=compiled
#GOOGLE_CLOSUREBUILDER_SCRIPT += --compiler_jar=$(GOOGLE_PATH)/closure-compiler/build/compiler.jar
#GOOGLE_CLOSUREBUILDER_SCRIPT += $(patsubst %,--compiler_flags="%",$(strip $(GOOGLE_COMPILER_FLAGS)))
#GOOGLE_CLOSUREBUILDER_SCRIPT += $(patsubst %,--compiler_flags="--externs=%",$(strip $4))
#GOOGLE_CLOSUREBUILDER_SCRIPT += $(patsubst %,--compiler_flags="--create_source_map=%",$(strip $5))
#GOOGLE_CLOSUREBUILDER_SCRIPT += --compiler_flags="--output_wrapper=%output%"
#GOOGLE_CLOSUREBUILDER_SCRIPT += --output_file=$(strip $6)
#GOOGLE_CLOSUREBUILDER_SCRIPT += $(if $(V),,$(GOOGLE_CLOSUREBUILDER_MUTE))

#GOOGLE_CLOSUREBUILDER_DEPS += $(GOOGLE_PATH)/closure-library/closure/bin/build/closurebuilder.py
#GOOGLE_CLOSUREBUILDER_DEPS += $(GOOGLE_PATH)/closure-compiler/build/compiler.jar

GOOGLE_CLOSUREBUILDER_SCRIPT = java
GOOGLE_CLOSUREBUILDER_SCRIPT += -client
GOOGLE_CLOSUREBUILDER_SCRIPT += -jar $(GOOGLE_PATH)/closure-compiler/build/compiler.jar
GOOGLE_CLOSUREBUILDER_SCRIPT += --only_closure_dependencies
GOOGLE_CLOSUREBUILDER_SCRIPT += --closure_entry_point $(strip $1)
GOOGLE_CLOSUREBUILDER_SCRIPT += $(strip $2)
GOOGLE_CLOSUREBUILDER_SCRIPT += $(strip $3)
GOOGLE_CLOSUREBUILDER_SCRIPT += $(patsubst %,--externs=%,$(strip $4))
GOOGLE_CLOSUREBUILDER_SCRIPT += --create_source_map=$(strip $5)
GOOGLE_CLOSUREBUILDER_SCRIPT += --js_output_file=$(strip $6)
GOOGLE_CLOSUREBUILDER_SCRIPT += $(GOOGLE_COMPILER_FLAGS)

GOOGLE_CLOSUREBUILDER_DEPS += $(GOOGLE_PATH)/closure-compiler/build/compiler.jar

google-setup: google-closure-compiler-setup

google-closure-compiler-setup: setup-have-git
google-closure-compiler-setup: setup-have-python
google-closure-compiler-setup: setup-have-java
google-closure-compiler-setup: setup-have-ant
google-closure-compiler-setup: SCRIPT = $(call SCRIPT_INIT,$@)
google-closure-compiler-setup: SCRIPT += && $(call NOTE,$@,"download closure compiler")
google-closure-compiler-setup: #SCRIPT += && mkdir -p $(GOOGLE_PATH)/closure-compiler
google-closure-compiler-setup: #SCRIPT += && curl http://closure-compiler.googlecode.com/files/compiler-latest.tar.gz
google-closure-compiler-setup: #SCRIPT +=      -o $(GOOGLE_PATH)/closure-compiler/compiler-latest.tar.gz
google-closure-compiler-setup: #SCRIPT += && tar -xvf $(GOOGLE_PATH)/closure-compiler/compiler-latest.tar.gz
google-closure-compiler-setup: #SCRIPT +=      -C $(GOOGLE_PATH)/closure-compiler/
google-closure-compiler-setup: SCRIPT += && if [ -d $(GOOGLE_PATH)/closure-compiler/.git ]; then
google-closure-compiler-setup: SCRIPT +=      ( cd $(GOOGLE_PATH)/closure-compiler && git pull )
google-closure-compiler-setup: SCRIPT +=    else
google-closure-compiler-setup: SCRIPT +=      rm -rf $(GOOGLE_PATH)/closure-compiler;
google-closure-compiler-setup: SCRIPT +=      git clone $(GOOGLE_CLOSURE_COMPILER_URL) $(GOOGLE_PATH)/closure-compiler/;
google-closure-compiler-setup: SCRIPT +=    fi
google-closure-compiler-setup: SCRIPT += && ( cd $(GOOGLE_PATH)/closure-compiler && git checkout $(GOOGLE_CLOSURE_COMPILER_REVISION) )
google-closure-compiler-setup: SCRIPT += && $(call NOTE,$@,"build closure compiler")
google-closure-compiler-setup: SCRIPT += && ( cd $(GOOGLE_PATH)/closure-compiler && ant $(if $(V),-verbose,-quiet) jar )
google-closure-compiler-setup: SCRIPT += && $(call SCRIPT_EXIT,$@)
google-closure-compiler-setup: ; $(call SCRIPT_RUN,$@,$(SCRIPT))

google-setup: google-closure-library-setup

google-closure-library-setup: setup-have-git
google-closure-library-setup: SCRIPT = $(call SCRIPT_INIT,$@)
google-closure-library-setup: SCRIPT += && $(call NOTE,$@,"download closure library")
google-closure-library-setup: SCRIPT += && if [ -d $(GOOGLE_PATH)/closure-library/.git ]; then
google-closure-library-setup: SCRIPT +=      ( cd $(GOOGLE_PATH)/closure-library && git pull )
google-closure-library-setup: SCRIPT +=    else
google-closure-library-setup: SCRIPT +=      rm -rf $(GOOGLE_PATH)/closure-library;
google-closure-library-setup: SCRIPT +=      git clone $(GOOGLE_CLOSURE_LIBRARY_URL) $(GOOGLE_PATH)/closure-library/;
google-closure-library-setup: SCRIPT +=    fi
google-closure-library-setup: SCRIPT += && ( cd $(GOOGLE_PATH)/closure-library && git checkout $(GOOGLE_CLOSURE_LIBRARY_REVISION) )
google-closure-library-setup: SCRIPT += && $(call SCRIPT_EXIT,$@)
google-closure-library-setup: ; $(call SCRIPT_RUN,$@,$(SCRIPT))

# node-closure

default-setup: node-closure-setup

node-closure-setup: setup-have-npm
node-closure-setup: SCRIPT = $(call SCRIPT_INIT,$@)
node-closure-setup: SCRIPT += && $(call NOTE,$@,"install node closure module")
node-closure-setup: SCRIPT += && npm install closure
node-closure-setup: SCRIPT += && $(call SCRIPT_EXIT,$@)
node-closure-setup: ; $(call SCRIPT_RUN,$@,$(SCRIPT))

# node-connect

#default-setup: node-connect-setup

node-connect-setup: setup-have-npm
node-connect-setup: SCRIPT = $(call SCRIPT_INIT,$@)
node-connect-setup: SCRIPT += && $(call NOTE,$@,"install node connect module")
node-connect-setup: SCRIPT += && npm install connect
node-connect-setup: SCRIPT += && $(call SCRIPT_EXIT,$@)
node-connect-setup: ; $(call SCRIPT_RUN,$@,$(SCRIPT))

# node-express

default-setup: node-express-setup

node-express-setup: setup-have-npm
node-express-setup: SCRIPT = $(call SCRIPT_INIT,$@)
node-express-setup: SCRIPT += && $(call NOTE,$@,"install node express module")
node-express-setup: SCRIPT += && npm install express
node-express-setup: SCRIPT += && $(call SCRIPT_EXIT,$@)
node-express-setup: ; $(call SCRIPT_RUN,$@,$(SCRIPT))

# web-server

WEB_SERVER_SCRIPT = web-server.js
WEB_SERVER_PORT ?= 3080

default-stop: stop-web-server

#start-web-server: setup-have-node-connect
start-web-server: SCRIPT = $(call SCRIPT_INIT,$@)
start-web-server: SCRIPT += && if [ ! -e web-server.pid ]; then
start-web-server: SCRIPT +=      printf "starting web-server on port %s...\n" $(WEB_SERVER_PORT);
start-web-server: SCRIPT +=      ( node $(WEB_SERVER_SCRIPT) $(WEB_SERVER_PORT) & echo $$! > web-server.pid );
start-web-server: SCRIPT +=      printf "started web-server on port %s (pid: %s)\n" $(WEB_SERVER_PORT) $$(cat web-server.pid);
start-web-server: SCRIPT +=    fi
start-web-server: SCRIPT += && $(call HOST_BROWSE,"http://localhost:$(WEB_SERVER_PORT)")
start-web-server: SCRIPT += && $(call SCRIPT_EXIT,$@)
start-web-server: ; $(call SCRIPT_RUN,$@,$(SCRIPT))

stop-web-server: SCRIPT = $(call SCRIPT_INIT,$@)
stop-web-server: SCRIPT += && if [ -e web-server.pid ]; then
stop-web-server: SCRIPT +=      printf "stopping web-server...\n";
stop-web-server: SCRIPT +=      $(call HOST_KILL,$$(cat web-server.pid));
stop-web-server: SCRIPT +=      printf "stopped web-server (pid: %s)\n" $$(cat web-server.pid);
stop-web-server: SCRIPT +=      rm -f web-server.pid;
stop-web-server: SCRIPT +=    fi
stop-web-server: SCRIPT += && $(call SCRIPT_EXIT,$@)
stop-web-server: ; $(call SCRIPT_RUN,$@,$(SCRIPT))

# spine.js

PROJECTS += spine

default-clean: spine-clean
default-build: spine-build

SPINE_SOURCE_JS_FILE = spine.js

SPINE_SOURCE_JS_FILES += $(SPINE_SOURCE_JS_FILE)

SPINE_OUTPUT_NAMESPACE = "spine"
SPINE_OUTPUT_MIN_JS_FILE = spine.min.js
SPINE_OUTPUT_MAP_JS_FILE = spine.map.js
SPINE_OUTPUT_DEP_JS_FILE = spine.dep.js

SPINE_OUTPUT_FILES = $(SPINE_OUTPUT_MIN_JS_FILE) $(SPINE_OUTPUT_MAP_JS_FILE) $(SPINE_OUTPUT_DEP_JS_FILE)

spine-clean: SCRIPT = $(call SCRIPT_INIT,$@)
spine-clean: SCRIPT += && rm -f $(SPINE_OUTPUT_FILES)
spine-clean: SCRIPT += && $(call SCRIPT_EXIT,$@)
spine-clean: ; $(call SCRIPT_RUN,$@,$(SCRIPT))

spine-build: $(SPINE_OUTPUT_FILES)
spine-build: SCRIPT = $(call SCRIPT_INIT,$@)
spine-build: SCRIPT += && $(call SCRIPT_EXIT,$@)
spine-build: ; $(call SCRIPT_RUN,$@,$(SCRIPT))

$(SPINE_OUTPUT_DEP_JS_FILE): $(GOOGLE_DEPSWRITER_DEPS)
$(SPINE_OUTPUT_DEP_JS_FILE): $(GOOGLE_PATH)/closure-library/closure/goog/base.js
$(SPINE_OUTPUT_DEP_JS_FILE): $(SPINE_SOURCE_JS_FILES)
$(SPINE_OUTPUT_DEP_JS_FILE): SOURCE_JS_FILES += $(GOOGLE_PATH)/closure-library/closure/goog/base.js
$(SPINE_OUTPUT_DEP_JS_FILE): SOURCE_JS_FILES += $(SPINE_SOURCE_JS_FILES)
$(SPINE_OUTPUT_DEP_JS_FILE): SCRIPT = $(call SCRIPT_INIT,$@)
$(SPINE_OUTPUT_DEP_JS_FILE): SCRIPT += && $(call GOOGLE_DEPSWRITER_SCRIPT,
$(SPINE_OUTPUT_DEP_JS_FILE): SCRIPT +=      $(SOURCE_JS_PATHS), $(SOURCE_JS_FILES),
$(SPINE_OUTPUT_DEP_JS_FILE): SCRIPT +=      $(SPINE_OUTPUT_DEP_JS_FILE))
$(SPINE_OUTPUT_DEP_JS_FILE): SCRIPT += && $(call SCRIPT_EXIT,$@)
$(SPINE_OUTPUT_DEP_JS_FILE): ; $(call SCRIPT_RUN,$@,$(SCRIPT))

$(SPINE_OUTPUT_MIN_JS_FILE): $(GOOGLE_CLOSUREBUILDER_DEPS)
$(SPINE_OUTPUT_MIN_JS_FILE): $(GOOGLE_PATH)/closure-library/closure/goog/base.js
$(SPINE_OUTPUT_MIN_JS_FILE): $(SPINE_SOURCE_JS_FILES)
$(SPINE_OUTPUT_MIN_JS_FILE): SOURCE_JS_FILES += $(GOOGLE_PATH)/closure-library/closure/goog/base.js
$(SPINE_OUTPUT_MIN_JS_FILE): SOURCE_JS_FILES += $(SPINE_SOURCE_JS_FILES)
$(SPINE_OUTPUT_MIN_JS_FILE): SCRIPT = $(call SCRIPT_INIT,$@)
$(SPINE_OUTPUT_MIN_JS_FILE): SCRIPT += && $(call GOOGLE_CLOSUREBUILDER_SCRIPT,
$(SPINE_OUTPUT_MIN_JS_FILE): SCRIPT +=      $(SPINE_OUTPUT_NAMESPACE),
$(SPINE_OUTPUT_MIN_JS_FILE): SCRIPT +=      $(SOURCE_JS_PATHS), $(SOURCE_JS_FILES),
$(SPINE_OUTPUT_MIN_JS_FILE): SCRIPT +=      $(SOURCE_EXT_JS_FILES),
$(SPINE_OUTPUT_MIN_JS_FILE): SCRIPT +=      $(SPINE_OUTPUT_MAP_JS_FILE),
$(SPINE_OUTPUT_MIN_JS_FILE): SCRIPT +=      $(SPINE_OUTPUT_MIN_JS_FILE))
$(SPINE_OUTPUT_MIN_JS_FILE): SCRIPT += && $(call SCRIPT_EXIT,$@)
$(SPINE_OUTPUT_MIN_JS_FILE): ; $(call SCRIPT_RUN,$@,$(SCRIPT))

$(SPINE_OUTPUT_MAP_JS_FILE): $(SPINE_OUTPUT_MIN_JS_FILE)
$(SPINE_OUTPUT_MAP_JS_FILE): SCRIPT = $(call SCRIPT_INIT,$@)
$(SPINE_OUTPUT_MAP_JS_FILE): SCRIPT += && touch $@
$(SPINE_OUTPUT_MAP_JS_FILE): SCRIPT += && $(call SCRIPT_EXIT,$@)
$(SPINE_OUTPUT_MAP_JS_FILE): ; $(call SCRIPT_RUN,$@,$(SCRIPT))

# spine-demo.js

PROJECTS += spine-demo

default-clean: spine-demo-clean
default-build: spine-demo-build
default-run: spine-demo-run

SPINE_DEMO_SOURCE_JS_FILE = spine-demo.js

SPINE_DEMO_SOURCE_JS_FILES += $(SPINE_DEMO_SOURCE_JS_FILE)
SPINE_DEMO_SOURCE_JS_FILES += spine.js
SPINE_DEMO_SOURCE_JS_FILES += flyover.js

SPINE_DEMO_OUTPUT_NAMESPACE = "main.start"
SPINE_DEMO_OUTPUT_MIN_JS_FILE = spine-demo.min.js
SPINE_DEMO_OUTPUT_MAP_JS_FILE = spine-demo.map.js
SPINE_DEMO_OUTPUT_DEP_JS_FILE = spine-demo.dep.js

SPINE_DEMO_OUTPUT_FILES = $(SPINE_DEMO_OUTPUT_MIN_JS_FILE) $(SPINE_DEMO_OUTPUT_MAP_JS_FILE) $(SPINE_DEMO_OUTPUT_DEP_JS_FILE)

spine-demo-clean: SCRIPT = $(call SCRIPT_INIT,$@)
spine-demo-clean: SCRIPT += && rm -f $(SPINE_DEMO_OUTPUT_FILES)
spine-demo-clean: SCRIPT += && $(call SCRIPT_EXIT,$@)
spine-demo-clean: ; $(call SCRIPT_RUN,$@,$(SCRIPT))

spine-demo-build: $(SPINE_DEMO_OUTPUT_FILES)
spine-demo-build: SCRIPT = $(call SCRIPT_INIT,$@)
spine-demo-build: SCRIPT += && $(call SCRIPT_EXIT,$@)
spine-demo-build: ; $(call SCRIPT_RUN,$@,$(SCRIPT))

$(SPINE_DEMO_OUTPUT_DEP_JS_FILE): $(GOOGLE_DEPSWRITER_DEPS)
$(SPINE_DEMO_OUTPUT_DEP_JS_FILE): $(GOOGLE_PATH)/closure-library/closure/goog/base.js
$(SPINE_DEMO_OUTPUT_DEP_JS_FILE): $(SPINE_DEMO_SOURCE_JS_FILES)
$(SPINE_DEMO_OUTPUT_DEP_JS_FILE): SOURCE_JS_FILES += $(GOOGLE_PATH)/closure-library/closure/goog/base.js
$(SPINE_DEMO_OUTPUT_DEP_JS_FILE): SOURCE_JS_FILES += $(SPINE_DEMO_SOURCE_JS_FILES)
$(SPINE_DEMO_OUTPUT_DEP_JS_FILE): SCRIPT = $(call SCRIPT_INIT,$@)
$(SPINE_DEMO_OUTPUT_DEP_JS_FILE): SCRIPT += && $(call GOOGLE_DEPSWRITER_SCRIPT,
$(SPINE_DEMO_OUTPUT_DEP_JS_FILE): SCRIPT +=      $(SOURCE_JS_PATHS), $(SOURCE_JS_FILES),
$(SPINE_DEMO_OUTPUT_DEP_JS_FILE): SCRIPT +=      $(SPINE_DEMO_OUTPUT_DEP_JS_FILE))
$(SPINE_DEMO_OUTPUT_DEP_JS_FILE): SCRIPT += && $(call SCRIPT_EXIT,$@)
$(SPINE_DEMO_OUTPUT_DEP_JS_FILE): ; $(call SCRIPT_RUN,$@,$(SCRIPT))

$(SPINE_DEMO_OUTPUT_MIN_JS_FILE): $(GOOGLE_CLOSUREBUILDER_DEPS)
$(SPINE_DEMO_OUTPUT_MIN_JS_FILE): $(GOOGLE_PATH)/closure-library/closure/goog/base.js
$(SPINE_DEMO_OUTPUT_MIN_JS_FILE): $(SPINE_DEMO_SOURCE_JS_FILES)
$(SPINE_DEMO_OUTPUT_MIN_JS_FILE): SOURCE_JS_FILES += $(GOOGLE_PATH)/closure-library/closure/goog/base.js
$(SPINE_DEMO_OUTPUT_MIN_JS_FILE): SOURCE_JS_FILES += $(SPINE_DEMO_SOURCE_JS_FILES)
$(SPINE_DEMO_OUTPUT_MIN_JS_FILE): SCRIPT = $(call SCRIPT_INIT,$@)
$(SPINE_DEMO_OUTPUT_MIN_JS_FILE): SCRIPT += && $(call GOOGLE_CLOSUREBUILDER_SCRIPT,
$(SPINE_DEMO_OUTPUT_MIN_JS_FILE): SCRIPT +=      $(SPINE_DEMO_OUTPUT_NAMESPACE),
$(SPINE_DEMO_OUTPUT_MIN_JS_FILE): SCRIPT +=      $(SOURCE_JS_PATHS), $(SOURCE_JS_FILES),
$(SPINE_DEMO_OUTPUT_MIN_JS_FILE): SCRIPT +=      $(SOURCE_EXT_JS_FILES),
$(SPINE_DEMO_OUTPUT_MIN_JS_FILE): SCRIPT +=      $(SPINE_DEMO_OUTPUT_MAP_JS_FILE),
$(SPINE_DEMO_OUTPUT_MIN_JS_FILE): SCRIPT +=      $(SPINE_DEMO_OUTPUT_MIN_JS_FILE))
$(SPINE_DEMO_OUTPUT_MIN_JS_FILE): SCRIPT += && $(call SCRIPT_EXIT,$@)
$(SPINE_DEMO_OUTPUT_MIN_JS_FILE): ; $(call SCRIPT_RUN,$@,$(SCRIPT))

$(SPINE_DEMO_OUTPUT_MAP_JS_FILE): $(SPINE_DEMO_OUTPUT_MIN_JS_FILE)
$(SPINE_DEMO_OUTPUT_MAP_JS_FILE): SCRIPT = $(call SCRIPT_INIT,$@)
$(SPINE_DEMO_OUTPUT_MAP_JS_FILE): SCRIPT += && touch $@
$(SPINE_DEMO_OUTPUT_MAP_JS_FILE): SCRIPT += && $(call SCRIPT_EXIT,$@)
$(SPINE_DEMO_OUTPUT_MAP_JS_FILE): ; $(call SCRIPT_RUN,$@,$(SCRIPT))

spine-demo-run: spine-demo-run-web
spine-demo-run: SCRIPT = $(call SCRIPT_INIT,$@)
spine-demo-run: SCRIPT += && $(call SCRIPT_EXIT,$@)
spine-demo-run: ; $(call SCRIPT_RUN,$@,$(SCRIPT))

spine-demo-run-web: start-web-server
spine-demo-run-web: URL = "http://localhost:$(WEB_SERVER_PORT)/index.html?test/data/test.json"$(if $(D),"&debug")
spine-demo-run-web: SCRIPT = $(call SCRIPT_INIT,$@)
spine-demo-run-web: SCRIPT += && $(call HOST_BROWSE,$(URL))
spine-demo-run-web: SCRIPT += && $(call SCRIPT_EXIT,$@)
spine-demo-run-web: ; $(call SCRIPT_RUN,$@,$(SCRIPT))

# spine2spriter.js

PROJECTS += spine2spriter

default-clean: spine2spriter-clean
default-build: spine2spriter-build

SPINE2SPRITER_SOURCE_JS_FILE = spine2spriter.js

SPINE2SPRITER_SOURCE_JS_FILES += $(SPINE2SPRITER_SOURCE_JS_FILE)
SPINE2SPRITER_SOURCE_JS_FILES += spine.js
SPINE2SPRITER_SOURCE_JS_FILES += jsonxml/json2xml.js
SPINE2SPRITER_SOURCE_JS_FILES += flyover.js

SPINE2SPRITER_OUTPUT_NAMESPACE = "main.start"
SPINE2SPRITER_OUTPUT_MIN_JS_FILE = spine2spriter.min.js
SPINE2SPRITER_OUTPUT_MAP_JS_FILE = spine2spriter.map.js
SPINE2SPRITER_OUTPUT_DEP_JS_FILE = spine2spriter.dep.js

#SPINE2SPRITER_OUTPUT_FILES += $(SPINE2SPRITER_OUTPUT_MIN_JS_FILE) $(SPINE2SPRITER_OUTPUT_MAP_JS_FILE)
SPINE2SPRITER_OUTPUT_FILES += $(SPINE2SPRITER_OUTPUT_DEP_JS_FILE)

spine2spriter-clean: SCRIPT = $(call SCRIPT_INIT,$@)
spine2spriter-clean: SCRIPT += && rm -f $(SPINE2SPRITER_OUTPUT_FILES)
spine2spriter-clean: SCRIPT += && $(call SCRIPT_EXIT,$@)
spine2spriter-clean: ; $(call SCRIPT_RUN,$@,$(SCRIPT))

spine2spriter-build: $(SPINE2SPRITER_OUTPUT_FILES)
spine2spriter-build: SCRIPT = $(call SCRIPT_INIT,$@)
spine2spriter-build: SCRIPT += && $(call SCRIPT_EXIT,$@)
spine2spriter-build: ; $(call SCRIPT_RUN,$@,$(SCRIPT))

$(SPINE2SPRITER_OUTPUT_DEP_JS_FILE): $(GOOGLE_DEPSWRITER_DEPS)
$(SPINE2SPRITER_OUTPUT_DEP_JS_FILE): $(GOOGLE_PATH)/closure-library/closure/goog/base.js
$(SPINE2SPRITER_OUTPUT_DEP_JS_FILE): $(SPINE2SPRITER_SOURCE_JS_FILES)
$(SPINE2SPRITER_OUTPUT_DEP_JS_FILE): SOURCE_JS_FILES += $(GOOGLE_PATH)/closure-library/closure/goog/base.js
$(SPINE2SPRITER_OUTPUT_DEP_JS_FILE): SOURCE_JS_FILES += $(SPINE2SPRITER_SOURCE_JS_FILES)
$(SPINE2SPRITER_OUTPUT_DEP_JS_FILE): SCRIPT = $(call SCRIPT_INIT,$@)
$(SPINE2SPRITER_OUTPUT_DEP_JS_FILE): SCRIPT += && $(call GOOGLE_DEPSWRITER_SCRIPT,
$(SPINE2SPRITER_OUTPUT_DEP_JS_FILE): SCRIPT +=      $(SOURCE_JS_PATHS), $(SOURCE_JS_FILES),
$(SPINE2SPRITER_OUTPUT_DEP_JS_FILE): SCRIPT +=      $(SPINE2SPRITER_OUTPUT_DEP_JS_FILE))
$(SPINE2SPRITER_OUTPUT_DEP_JS_FILE): SCRIPT += && $(call SCRIPT_EXIT,$@)
$(SPINE2SPRITER_OUTPUT_DEP_JS_FILE): ; $(call SCRIPT_RUN,$@,$(SCRIPT))

$(SPINE2SPRITER_OUTPUT_MIN_JS_FILE): $(GOOGLE_CLOSUREBUILDER_DEPS)
$(SPINE2SPRITER_OUTPUT_MIN_JS_FILE): $(GOOGLE_PATH)/closure-library/closure/goog/base.js
$(SPINE2SPRITER_OUTPUT_MIN_JS_FILE): $(SPINE2SPRITER_SOURCE_JS_FILES)
$(SPINE2SPRITER_OUTPUT_MIN_JS_FILE): SOURCE_JS_FILES += $(GOOGLE_PATH)/closure-library/closure/goog/base.js
$(SPINE2SPRITER_OUTPUT_MIN_JS_FILE): SOURCE_JS_FILES += $(SPINE2SPRITER_SOURCE_JS_FILES)
$(SPINE2SPRITER_OUTPUT_MIN_JS_FILE): SCRIPT = $(call SCRIPT_INIT,$@)
$(SPINE2SPRITER_OUTPUT_MIN_JS_FILE): SCRIPT += && $(call GOOGLE_CLOSUREBUILDER_SCRIPT,
$(SPINE2SPRITER_OUTPUT_MIN_JS_FILE): SCRIPT +=      $(SPINE2SPRITER_OUTPUT_NAMESPACE),
$(SPINE2SPRITER_OUTPUT_MIN_JS_FILE): SCRIPT +=      $(SOURCE_JS_PATHS), $(SOURCE_JS_FILES),
$(SPINE2SPRITER_OUTPUT_MIN_JS_FILE): SCRIPT +=      $(SOURCE_EXT_JS_FILES),
$(SPINE2SPRITER_OUTPUT_MIN_JS_FILE): SCRIPT +=      $(SPINE2SPRITER_OUTPUT_MAP_JS_FILE),
$(SPINE2SPRITER_OUTPUT_MIN_JS_FILE): SCRIPT +=      $(SPINE2SPRITER_OUTPUT_MIN_JS_FILE))
$(SPINE2SPRITER_OUTPUT_MIN_JS_FILE): SCRIPT += && $(call SCRIPT_EXIT,$@)
$(SPINE2SPRITER_OUTPUT_MIN_JS_FILE): ; $(call SCRIPT_RUN,$@,$(SCRIPT))

$(SPINE2SPRITER_OUTPUT_MAP_JS_FILE): $(SPINE2SPRITER_OUTPUT_MIN_JS_FILE)
$(SPINE2SPRITER_OUTPUT_MAP_JS_FILE): SCRIPT = $(call SCRIPT_INIT,$@)
$(SPINE2SPRITER_OUTPUT_MAP_JS_FILE): SCRIPT += && touch $@
$(SPINE2SPRITER_OUTPUT_MAP_JS_FILE): SCRIPT += && $(call SCRIPT_EXIT,$@)
$(SPINE2SPRITER_OUTPUT_MAP_JS_FILE): ; $(call SCRIPT_RUN,$@,$(SCRIPT))

# rules

# link each command to default
$(foreach command,$(COMMANDS),\
  $(eval $(command): default-$(command) ; @true)\
)

# generate verb/noun (<command>-<project>) aliases
$(foreach project,$(PROJECTS),\
  $(foreach command,$(COMMANDS),\
    $(eval $(command)-$(project): $(project)-$(command) ; @true)\
  )\
)

# generate default rule for each project
$(foreach project,$(PROJECTS),\
  $(eval $(project)-%: ; @ $(call TODO,$$@))\
)

#### old stuff
####
####CLOSURE_COMPILER_PATH = closure-compiler
####CLOSURE_LIBRARY_PATH = closure-library
####
##### closure depswriter needs the relative path from base.js in 
##### $(CLOSURE_LIBRARY_PATH)/closure/goog to this makefile directory
####CLOSURE_DEPSWRITER_PREFIX = $(shell python -c "import os.path; print os.path.relpath('.', '$(CLOSURE_LIBRARY_PATH)/closure/goog')")
####
####clean: clean-spine-demo
####clean: clean-spine2spriter
####clean:
####	$(call DONE,$@)
####
####build: build-spine-demo
####build: build-spine2spriter
####build:
####	$(call DONE,$@)
####
####run: run-spine-demo
####run: run-spine2spriter
####run:
####	$(call DONE,$@)
####
####debug: debug-spine-demo
####debug: debug-spine2spriter
####debug:
####	$(call DONE,$@)
####
##### setup
####
####setup:
####	$(MAKE) --no-print-directory setup-closure-compiler
####	$(MAKE) --no-print-directory setup-closure-library
####	$(MAKE) --no-print-directory setup-node-closure
####	$(call DONE,$@)
####	
##### setup-closure-compiler	
####	
####setup-closure-compiler:
####	$(SETUP_CLOSURE_COMPILER_COMMAND)
####	$(call DONE,$@)
####
####SETUP_CLOSURE_COMPILER_COMMAND += mkdir -p $(CLOSURE_COMPILER_PATH) ;
####SETUP_CLOSURE_COMPILER_COMMAND += if [ -e $(CLOSURE_COMPILER_PATH)/compiler-latest.tar.gz ] ; then
####SETUP_CLOSURE_COMPILER_COMMAND +=  curl http://dl.google.com/closure-compiler/compiler-latest.tar.gz
####SETUP_CLOSURE_COMPILER_COMMAND +=   -o $(CLOSURE_COMPILER_PATH)/compiler-latest.tar.gz
####SETUP_CLOSURE_COMPILER_COMMAND +=   -z $(CLOSURE_COMPILER_PATH)/compiler-latest.tar.gz ;
####SETUP_CLOSURE_COMPILER_COMMAND += else
####SETUP_CLOSURE_COMPILER_COMMAND +=  curl http://dl.google.com/closure-compiler/compiler-latest.tar.gz
####SETUP_CLOSURE_COMPILER_COMMAND +=   -o $(CLOSURE_COMPILER_PATH)/compiler-latest.tar.gz ;
####SETUP_CLOSURE_COMPILER_COMMAND += fi ;
####SETUP_CLOSURE_COMPILER_COMMAND += tar -zxvf $(CLOSURE_COMPILER_PATH)/compiler-latest.tar.gz -C $(CLOSURE_COMPILER_PATH)/ ;
####
##### setup-closure-library
####
####setup-closure-library:
####	$(SETUP_CLOSURE_LIBRARY_COMMAND)
####	$(call DONE,$@)
####
####SETUP_CLOSURE_LIBRARY_COMMAND += mkdir -p $(CLOSURE_LIBRARY_PATH) ;
####SETUP_CLOSURE_LIBRARY_COMMAND += svn checkout http://closure-library.googlecode.com/svn/trunk/ $(CLOSURE_LIBRARY_PATH) ;
####
##### setup-node-closure
####
####setup-node-closure:
####	npm install closure
####	$(call DONE,$@)
####
##### server
####
####SERVER_PORT = 3000
####
####start: server-start
####server-start:
####	@$(SERVER_START_COMMAND)
####	$(call DONE,$@)
####
####SERVER_START_COMMAND += if [ -e /usr/sbin/lighttpd ];
####SERVER_START_COMMAND += then
####SERVER_START_COMMAND +=  printf "start web server using: "$(ANSI_BLUE)"lighttpd"$(ANSI_NONE)" on port "$(SERVER_PORT)"\n";
####SERVER_START_COMMAND +=  [ -e server.pid ] && ( cat server.pid | xargs -n1 kill ; rm -f server.pid ) || true;
####SERVER_START_COMMAND +=  echo "server.document-root = \"$$(pwd)\"" > lighttpd.conf;
####SERVER_START_COMMAND +=  echo "server.port = $(SERVER_PORT)" >> lighttpd.conf;
####SERVER_START_COMMAND +=  echo "server.username = \"www\"" >> lighttpd.conf;
####SERVER_START_COMMAND +=  echo "server.groupname = \"www\"" >> lighttpd.conf;
####SERVER_START_COMMAND +=  echo "mimetype.assign = (" >> lighttpd.conf;
####SERVER_START_COMMAND +=  echo " \".html\" => \"text/html\"," >> lighttpd.conf;
####SERVER_START_COMMAND +=  echo " \".css\" => \"text/css\"," >> lighttpd.conf;
####SERVER_START_COMMAND +=  echo " \".txt\" => \"text/plain\"," >> lighttpd.conf;
####SERVER_START_COMMAND +=  echo " \".js\" => \"text/javascript\"," >> lighttpd.conf;
####SERVER_START_COMMAND +=  echo " \".jpg\" => \"image/jpeg\"," >> lighttpd.conf;
####SERVER_START_COMMAND +=  echo " \".gif\" => \"image/gif\"," >> lighttpd.conf;
####SERVER_START_COMMAND +=  echo " \".png\" => \"image/png\"," >> lighttpd.conf;
####SERVER_START_COMMAND +=  echo " \".ttf\" => \"application/x-font-ttf\"" >> lighttpd.conf;
####SERVER_START_COMMAND +=  echo ")" >> lighttpd.conf;
####SERVER_START_COMMAND +=  echo "static-file.exclude-extensions = ( \".fcgi\", \".php\", \".rb\", \"~\", \".inc\" )" >> lighttpd.conf;
####SERVER_START_COMMAND +=  echo "index-file.names = ( \"index.html\" )" >> lighttpd.conf;
####SERVER_START_COMMAND +=  echo "dir-listing.activate = \"enable\"" >> lighttpd.conf;
####SERVER_START_COMMAND +=  ( /usr/sbin/lighttpd -D -f lighttpd.conf & echo $$! > server.pid );
####SERVER_START_COMMAND +=  sleep 1;
####SERVER_START_COMMAND += else
####SERVER_START_COMMAND +=  printf "start web server using "$(ANSI_BLUE)"python SimpleHTTPServer"$(ANSI_NONE)" on port "$(SERVER_PORT)"\n";
####SERVER_START_COMMAND +=  [ ! -e server.pid ] && ( python -m SimpleHTTPServer $(SERVER_PORT) & echo $$! > server.pid ) || true;
####SERVER_START_COMMAND +=  sleep 1;
####SERVER_START_COMMAND += fi
####
####stop: server-stop
####server-stop:
####	@$(SERVER_STOP_COMMAND)
####	$(call DONE,$@)
####
####SERVER_STOP_COMMAND += if [ -e /usr/sbin/lighttpd ];
####SERVER_STOP_COMMAND += then
####SERVER_STOP_COMMAND +=  printf "stop web server using: "$(ANSI_BLUE)"lighttpd"$(ANSI_NONE)" on port "$(SERVER_PORT)"\n";
####SERVER_STOP_COMMAND +=  [ -e server.pid ] && ( cat server.pid | xargs -n1 kill ; rm -f server.pid ) || true;
####SERVER_STOP_COMMAND += else
####SERVER_STOP_COMMAND +=  printf "stop web server using "$(ANSI_BLUE)"python SimpleHTTPServer"$(ANSI_NONE)" on port "$(SERVER_PORT)"\n";
####SERVER_STOP_COMMAND +=  [ -e server.pid ] && ( cat server.pid | xargs -n1 kill ; rm -f server.pid ) || true;
####SERVER_STOP_COMMAND += fi;
####
##### spine-demo
####
####spine-demo:
####	$(MAKE) --no-print-directory setup
####	$(MAKE) --no-print-directory build-spine-demo
####	$(MAKE) --no-print-directory server-start
####	$(MAKE) --no-print-directory run-spine-demo
####	$(call DONE,$@)
####
####clean-spine-demo: clean-spine-demo-js-deps
####clean-spine-demo: clean-spine-demo-js-output
####clean-spine-demo:
####	$(call DONE,$@)
####
####build-spine-demo: build-spine-demo-js-deps
####build-spine-demo: build-spine-demo-js-output
####build-spine-demo:
####	$(call DONE,$@)
####
##### spine-demo-js
####
####SPINE_DEMO_JS_SOURCE_FILES += spine-demo-main.js
####SPINE_DEMO_JS_SOURCE_FILES += spine.js
####SPINE_DEMO_JS_SOURCE_FILES += flyover.js
####SPINE_DEMO_JS_SOURCE_FILES += jsonxml/json2xml.js
####
####SPINE_DEMO_JS_SOURCE_PATHS += $(CLOSURE_LIBRARY_PATH)/third_party/closure/goog
####SPINE_DEMO_JS_SOURCE_PATHS += $(CLOSURE_LIBRARY_PATH)/closure/goog
####
##### spine-demo-js-deps
####
####SPINE_DEMO_JS_DEPS_OUTPUT_FILE = spine-demo-deps.js
####
####clean-spine-demo-js-deps:
####	rm -fv $(SPINE_DEMO_JS_DEPS_OUTPUT_FILE)
####	$(call DONE,$@)
####
####build-spine-demo-js-deps:
####	$(SPINE_DEMO_JS_DEPS_COMMAND)
####	$(call DONE,$@)
####
####SPINE_DEMO_JS_DEPS_COMMAND += $(CLOSURE_LIBRARY_PATH)/closure/bin/build/depswriter.py
####SPINE_DEMO_JS_DEPS_COMMAND += $(foreach file,$(SPINE_DEMO_JS_SOURCE_FILES),--path_with_depspath="$(file) $(CLOSURE_DEPSWRITER_PREFIX)/$(file)")
####SPINE_DEMO_JS_DEPS_COMMAND += $(foreach path,$(SPINE_DEMO_JS_SOURCE_PATHS),--root_with_prefix="$(path) $(CLOSURE_DEPSWRITER_PREFIX)/$(path)")
####SPINE_DEMO_JS_DEPS_COMMAND += > $(SPINE_DEMO_JS_DEPS_OUTPUT_FILE)
####
##### spine-demo-js-output
####
####SPINE_DEMO_JS_OUTPUT_NAMESPACE = "main.start"
####SPINE_DEMO_JS_OUTPUT_FILE = spine-demo-compiled.js
####
####clean-spine-demo-js-output:
####	rm -f $(SPINE_DEMO_JS_OUTPUT_FILE)
####	$(call DONE,$@)
####
####build-spine-demo-js-output: build-spine-demo-js-deps
####build-spine-demo-js-output:
####	$(SPINE_DEMO_JS_OUTPUT_COMMAND)
####	$(call DONE,$@)
####
####SPINE_DEMO_JS_OUTPUT_COMMAND += $(CLOSURE_LIBRARY_PATH)/closure/bin/build/closurebuilder.py
####SPINE_DEMO_JS_OUTPUT_COMMAND += --namespace=$(SPINE_DEMO_JS_OUTPUT_NAMESPACE)
####SPINE_DEMO_JS_OUTPUT_COMMAND += $(SPINE_DEMO_JS_SOURCE_FILES)
####SPINE_DEMO_JS_OUTPUT_COMMAND += $(patsubst %,--root=%,$(SPINE_DEMO_JS_SOURCE_PATHS))
####SPINE_DEMO_JS_OUTPUT_COMMAND += --output_mode=compiled
####SPINE_DEMO_JS_OUTPUT_COMMAND += --compiler_jar=$(CLOSURE_COMPILER_PATH)/compiler.jar
####SPINE_DEMO_JS_OUTPUT_COMMAND += $(SPINE_DEMO_JS_COMPILER_FLAGS)
####SPINE_DEMO_JS_OUTPUT_COMMAND += --output_file=$(SPINE_DEMO_JS_OUTPUT_FILE)
####
####SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--generate_exports"
####
#####SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--compilation_level=WHITESPACE_ONLY"
####SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--compilation_level=SIMPLE_OPTIMIZATIONS"
#####SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--compilation_level=ADVANCED_OPTIMIZATIONS"
####
####SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--define=goog.DEBUG=false"
####
####SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=accessControls"
####SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=ambiguousFunctionDecl"
####SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=checkRegExp"
####SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=checkTypes"
####SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=checkVars"
####SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=constantProperty"
####SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=deprecated"
####SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=es5Strict"
####SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=externsValidation"
####SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=fileoverviewTags"
####SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=globalThis"
####SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=internetExplorerChecks"
####SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=invalidCasts"
####SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=missingProperties"
####SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=nonStandardJsDocs"
####SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=strictModuleDepCheck"
####SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=typeInvalidation"
####SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=undefinedVars"
####SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=unknownDefines"
####SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=uselessCode"
####SPINE_DEMO_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=visibility"
####
##### debug-spine-demo
####
####RUN_SPINE_DEMO_URL = http://localhost:$(SERVER_PORT)/index.html
####
####run-spine-demo:
####	if [[ "$${OSTYPE}" == "cygwin" ]]; then cygstart $(RUN_SPINE_DEMO_URL); fi
####	if [[ "$${OSTYPE}" == "darwin"* ]]; then open $(RUN_SPINE_DEMO_URL); fi
####	if [[ "$${OSTYPE}" == "linux"* ]]; then xdg-open $(RUN_SPINE_DEMO_URL); fi
####	$(call DONE,$@)
####
##### debug-spine-demo
####
####DEBUG_SPINE_DEMO_URL = http://localhost:$(SERVER_PORT)/index-debug.html
####
####debug-spine-demo:
####	if [[ "$${OSTYPE}" == "cygwin" ]]; then cygstart $(DEBUG_SPINE_DEMO_URL); fi
####	if [[ "$${OSTYPE}" == "darwin"* ]]; then open $(DEBUG_SPINE_DEMO_URL); fi
####	if [[ "$${OSTYPE}" == "linux"* ]]; then xdg-open $(DEBUG_SPINE_DEMO_URL); fi
####	$(call DONE,$@)
####
##### spine2spriter
####
####spine2spriter:
####	$(MAKE) --no-print-directory setup
####	$(MAKE) --no-print-directory build-spine2spriter
####	$(MAKE) --no-print-directory run-spine2spriter
####	$(call DONE,$@)
####
####clean-spine2spriter: clean-spine2spriter-js-deps
####clean-spine2spriter: clean-spine2spriter-js-output
####clean-spine2spriter:
####	$(call DONE,$@)
####
####build-spine2spriter: build-spine2spriter-js-deps
####build-spine2spriter: build-spine2spriter-js-output
####build-spine2spriter:
####	$(call DONE,$@)
####
##### spine2spriter-js
####
####SPINE2SPRITER_JS_SOURCE_FILES += spine.js
####SPINE2SPRITER_JS_SOURCE_FILES += flyover.js
####SPINE2SPRITER_JS_SOURCE_FILES += jsonxml/json2xml.js
####
####SPINE2SPRITER_JS_SOURCE_PATHS += $(CLOSURE_LIBRARY_PATH)/third_party/closure/goog
####SPINE2SPRITER_JS_SOURCE_PATHS += $(CLOSURE_LIBRARY_PATH)/closure/goog
####
##### spine2spriter-js-deps
####
####SPINE2SPRITER_JS_DEPS_OUTPUT_FILE = spine2spriter-deps.js
####
####clean-spine2spriter-js-deps:
####	rm -fv $(SPINE2SPRITER_JS_DEPS_OUTPUT_FILE)
####	$(call DONE,$@)
####
####build-spine2spriter-js-deps:
####	$(SPINE2SPRITER_JS_DEPS_COMMAND)
####	$(call DONE,$@)
####
####SPINE2SPRITER_JS_DEPS_COMMAND += $(CLOSURE_LIBRARY_PATH)/closure/bin/build/depswriter.py
####SPINE2SPRITER_JS_DEPS_COMMAND += $(foreach file,$(SPINE2SPRITER_JS_SOURCE_FILES),--path_with_depspath="$(file) $(CLOSURE_DEPSWRITER_PREFIX)/$(file)")
####SPINE2SPRITER_JS_DEPS_COMMAND += $(foreach path,$(SPINE2SPRITER_JS_SOURCE_PATHS),--root_with_prefix="$(path) $(CLOSURE_DEPSWRITER_PREFIX)/$(path)")
####SPINE2SPRITER_JS_DEPS_COMMAND += > $(SPINE2SPRITER_JS_DEPS_OUTPUT_FILE)
####
##### spine2spriter-js-output
####
####SPINE2SPRITER_JS_OUTPUT_NAMESPACE = "spine"
####SPINE2SPRITER_JS_OUTPUT_FILE = spine2spriter-compiled.js
####
####clean-spine2spriter-js-output:
####	rm -f $(SPINE2SPRITER_JS_OUTPUT_FILE)
####	$(call DONE,$@)
####
####build-spine2spriter-js-output: build-spine2spriter-js-deps
####build-spine2spriter-js-output:
####	$(SPINE2SPRITER_JS_OUTPUT_COMMAND)
####	$(call DONE,$@)
####
####SPINE2SPRITER_JS_OUTPUT_COMMAND += $(CLOSURE_LIBRARY_PATH)/closure/bin/build/closurebuilder.py
####SPINE2SPRITER_JS_OUTPUT_COMMAND += --namespace=$(SPINE2SPRITER_JS_OUTPUT_NAMESPACE)
####SPINE2SPRITER_JS_OUTPUT_COMMAND += $(SPINE2SPRITER_JS_SOURCE_FILES)
####SPINE2SPRITER_JS_OUTPUT_COMMAND += $(patsubst %,--root=%,$(SPINE2SPRITER_JS_SOURCE_PATHS))
####SPINE2SPRITER_JS_OUTPUT_COMMAND += --output_mode=compiled
####SPINE2SPRITER_JS_OUTPUT_COMMAND += --compiler_jar=$(CLOSURE_COMPILER_PATH)/compiler.jar
####SPINE2SPRITER_JS_OUTPUT_COMMAND += $(SPINE2SPRITER_JS_COMPILER_FLAGS)
####SPINE2SPRITER_JS_OUTPUT_COMMAND += --output_file=$(SPINE2SPRITER_JS_OUTPUT_FILE)
####
####SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--generate_exports"
####
#####SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--compilation_level=WHITESPACE_ONLY"
####SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--compilation_level=SIMPLE_OPTIMIZATIONS"
#####SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--compilation_level=ADVANCED_OPTIMIZATIONS"
####
####SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--define=goog.DEBUG=false"
####
####SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=accessControls"
####SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=ambiguousFunctionDecl"
####SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=checkRegExp"
####SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=checkTypes"
####SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=checkVars"
####SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=constantProperty"
####SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=deprecated"
####SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=es5Strict"
####SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=externsValidation"
####SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=fileoverviewTags"
####SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=globalThis"
####SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=internetExplorerChecks"
####SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=invalidCasts"
####SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=missingProperties"
####SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=nonStandardJsDocs"
####SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=strictModuleDepCheck"
####SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=typeInvalidation"
####SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=undefinedVars"
####SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=unknownDefines"
####SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=uselessCode"
####SPINE2SPRITER_JS_COMPILER_FLAGS += --compiler_flags="--jscomp_error=visibility"
####
##### debug-spine2spriter
####
####run-spine2spriter:
####	node spine2spriter.js
####	$(call DONE,$@)
####
##### debug-spine2spriter
####
####debug-spine2spriter:
####	@printf $(ANSI_CYAN)"TODO"$(ANSI_NONE)": debug spine2spriter using node inspector\n"
####	$(call DONE,$@)

