App = {
  initUploader : function(){
    var uploader = new plupload.Uploader({
        runtimes : 'html5',
        browse_button : 'pickfiles',
        multi_selection: false,
        container: document.getElementById('upload_container'),
        url: '/stors', // Temporary setting
        multipart: true,
        init: {
          PostInit: function(up) {
          },
          FilesAdded: function(up, files) {
            plupload.each(files, function(file) {
              document.getElementById('filelist').innerHTML += '<div id="' + file.id + '">' + file.name + ' (' + plupload.formatSize(file.size) + ') <b></b></div>';
            });
            up.start();
          },
          BeforeUpload: function(up, file){
            $('#' + file.id + ' b').html("<span> Uploading... </span>");
            $.get('/stors/presign', function(presign){
              up.settings.url = presign['form_action'];
              up.settings.multipart_params = {
                AWSAccessKeyId: presign['form_fields']['AWSAccessKeyId'],
                key: presign['form_fields']['key'],
                policy: presign['form_fields']['policy'],
                signature: presign['form_fields']['signature'],
                name: '',
                Filename: '${filename}'
              };
              file.upload_id = presign['upload_id'];
              file.status = plupload.UPLOADING;
              up.trigger("UploadFile", file);
            });
            return false;
          },
          UploadProgress: function(up, file) {
            document.getElementById(file.id).getElementsByTagName('b')[0].innerHTML = '<span>' + file.percent + "%</span>";
          },
          FileUploaded: function(up, file){
            $('#meta').val('{"filename":"' + file.name + '"}');
            $('#' + file.id + ' b').html("<span> Edit meta field and click create to add to list </span>");
            App.createModel(file);
          },
          Error: function(up, err) {
            console.log(err);
            App.flash("error","fail");
          },
          UploadComplete: function(up, files){
          }
        }
    });
    uploader.init();
    App.createModel();
  },
  createModel : function(file){
    $('#create_model').unbind().click(function(e){
      e.preventDefault();
      if(file){
        data = "upload_id=" + file.upload_id + '&meta=' + encodeURIComponent($('#meta').val())
      }
      else{
        data = 'meta=' + encodeURIComponent($('#meta').val())
      }
      $.ajax({
        type: 'POST',
        url: '/stors',
        dataType: 'script',
        data: data,
        error: function(xhr, status, error){
          App.flash("error","fail");
        }
      });
    });
  },
  initCodeMirror : function(){
    var tarea = document.getElementById('run_code');
    var codeMirror = CodeMirror.fromTextArea(tarea,{
      value: tarea.value,
      tabSize: 2,
      lineWrapping: true,
      lineNumbers: true
    });
  },
  refreshStomSessions : function(){
    $.get('/stoms/sessions', function(data){
      $('#stom_sessions').html(data);
    });
  },
  pollRunResult : function(session_id, run_id, platform){
    $.poll(1000, function(retry){
			$.get('/stoms/' + session_id + '/result?run_id=' + run_id + '&platform=' + platform, function(data){
				if(data.state == 'created' && $('#stom_result').html() != '>> Run canceled'){ retry(); }
				else{
				  if($('#stom_result').html() != '>> Run canceled'){
				    $('#stom_result').html(data.result);
            $('#stom_log').html(data.log);
					  $('#run_button').attr('disabled', false);
				  }
				}
			});
		});
  },
  cancelRun : function(){
    $('#stom_result').html('>> Run canceled');
    $('#stom_log').html('>> Run canceled');
    $('#run_button').attr('disabled', false);
  },
  setCurrentSession : function(current_session_id){
    if(current_session_id != ''){
      $('#current_stom_session_id').html(current_session_id);
      $('#run_button').attr('disabled', false);
      $('#run_form').attr('action', '/stoms/' + current_session_id + '/run');
    }
    else{
      $('#current_stom_session_id').html('session is not available');
      $('#run_button').attr('disabled', true);
    }
  },
  setupDocumentations : function(){
    $(window).hashchange( function(){
      var src = location.hash.split('#')[1];
      if(!src){
        src = $('#getting_started').attr('href').split('#')[1];
      }
      $('#documentation iframe').attr('src', src);
    });
    $(window).hashchange();
  },
  refreshStomEngineVerions : function(){
    $.ajax({
      crossDomain: true,
      url: 'https://s3.amazonaws.com/stomit-engine-version/engine-version.json', 
      beforeSend: function( xhr ) {
        xhr.overrideMimeType( "text/plain; charset=x-user-defined" );
      }
    }).done(function( data ) {
      versions = JSON.parse(data);
      $('#engine_version').empty();
      $.each(versions, function(key, value) {   
        $('#engine_version')
          .append($("<option></option>")
          .attr("value",value)
          .text(value)); 
      });
    });
  },
  flash : function(type, msg){
    // types ["info", "warning", "error"]
    var $flash = $(document).find("div.alert");
    if ($flash !== null)
    {
      $flash.remove();
    }

    $flash = $(document.createElement("div"))
            .addClass("alert")
            .addClass("alert-"+type)
            .attr("data-alert", "alert")
            .attr("style", "text-align: center")
            .html(msg)
            .show()
            .prependTo($('body'));

    $(document.createElement("a")).addClass("close")
    .attr("data-dismiss", "alert")
    .attr("href","#")
    .html("×")
    .prependTo($flash);
  },
  bindConfirmEmail : function(){
    $('#resetCredentialsModal').on('show', function(){
      $('#user_email').val('');
      $('#btn_reset').attr('disabled', 'disabled');
    });

    var binding = function(e){
      var valid_email = $('#user_email').val().toLowerCase();
      var user_email = $('#valid_user_email').val().toLowerCase();

      if( valid_email == user_email ){
        $('#btn_reset').removeAttr('disabled');
      } else {
        $('#btn_reset').attr('disabled', 'disabled');
      }

      if(e.keyCode == 13 && user_email == valid_email) {
        App.resetCredentials();
        return;
      }
    };

    $('#user_email').keyup(binding);
    $('#user_email').change(binding);
  },
  resetCredentials : function(){
    if(confirm('WARNING!!!\rAre you sure to reset your credentials?!')){
      $.ajax({
        type: 'PUT',
        url: '/account/reset_credentials',
        success: function(res, status){
          if(status == 'success'){
            $('#resetCredentialsModal').modal('hide');
            $('#user_email').val('');
            $('#api_key').html(res.api_key);
            $('#api_secret').html(res.api_secret);
          } else {
            App.flash("error", "fail");
          }
        },
        error: function(xhr, status, error){
          App.flash("error","fail");
        }
      });
    }
  }
}