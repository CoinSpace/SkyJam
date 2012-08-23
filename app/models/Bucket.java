package models;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.Table;

import com.avaje.ebean.validation.Length;

import play.db.ebean.Model;
import play.db.ebean.Model.Finder;

@Entity
@Table(name="buckets")
public class Bucket extends AppModel {


	private static final long serialVersionUID = 1854388095675477416L;


	@Length(max=1024)
	private String name;
	
	
	@ManyToOne
	private AmazonAccount amazonAccount;
	

	
	public static Model.Finder<Integer,Bucket> find = new Finder<Integer, Bucket>(Integer.class, Bucket.class);
	
	
	
	public static Bucket getByName(String name)
	{
		return Bucket.find.where().eq("name", name).findUnique();
	}



	public String getName() {
		return name;
	}



	public void setName(String name) {
		this.name = name;
	}		
	
	public static Bucket getDefault(){
		return Bucket.find.orderBy("id ASC").setMaxRows(1).findUnique();
	}



	public AmazonAccount getAmazonAccount() {
		return amazonAccount;
	}



	public void setAmazonAccount(AmazonAccount amazonAccount) {
		this.amazonAccount = amazonAccount;
	}
	
}
